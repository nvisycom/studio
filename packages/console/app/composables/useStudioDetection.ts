import type { Audit, WorkspaceDetection } from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";
import type { DetectionSource } from "#console/providers/types";

/** Lifecycle phase of the studio's detection. `complete` = analysis ready. */
export type StudioDetectionPhase =
	| "idle"
	| "restoring"
	| "running"
	| "complete"
	| "failed";

/**
 * Owns the studio's detection lifecycle for the active file: the pipeline
 * choice, running a detection, restoring the file's most recent detection, and
 * the flattened entities the document + audit panel render. This is the studio's
 * long-running "job" — a detection can take seconds to minutes — so it's the
 * surface the desktop tray/notifications observe.
 *
 * Redaction (reviewer edits + applying them) is a separate concern; see
 * {@link useStudioRedaction}, which takes this composable's outputs as input.
 *
 * Call this once per studio page and share its result — the detection bar drives
 * the pipeline/detection controls while the audit panel and document overlay read
 * the entities, so both must observe the same state.
 */
export function useStudioDetection(
	fileId: MaybeRefOrGetter<string | null>,
	documentText: MaybeRefOrGetter<string | null>,
	docxParts?: MaybeRefOrGetter<Map<string, Uint8Array> | null>,
	fileName?: MaybeRefOrGetter<string | null>,
	documentBytes?: () => Promise<Uint8Array>,
) {
	const { t } = useI18n();
	const { pipelines } = usePipelines();
	// Detection runs through the injected provider: the server pipeline flow, or
	// the on-device engine when offline. The provider owns run + restore; this
	// composable owns the pipeline selection, phases, and restore orchestration.
	const { provider } = useDetectionProvider();
	// Native notifications for LOCAL events only. A server workspace already
	// notifies through the server's notification stream, so firing here too would
	// double up; a local, in-session run has no such stream, so the studio fires
	// the native one itself. No-op on web / server / when the event is disabled.
	const { notifications: native } = useNativeNotifications();
	const { currentWorkspaceIsLocal } = useWorkspaces();
	function notifyLocal(
		event: string,
		message: { title: string; body: string },
	) {
		if (currentWorkspaceIsLocal.value) native.value.emit?.(event, message);
	}

	/** The active detection backend, or throw the one canonical error. */
	function requireProvider() {
		const p = provider.value;
		if (!p) throw new Error("No detection backend available");
		return p;
	}

	// The pipeline chosen for a NEW detection (pipeline mode). Defaults to the
	// first pipeline once the list loads, so the "New detection" form has a
	// sensible pre-selection. Switching it no longer restores anything — the file's
	// detections are a list the reviewer picks from (below), not keyed off this.
	const selectedPipeline = ref<string>("");
	watch(
		pipelines,
		(list) => {
			if (list?.length && !selectedPipeline.value)
				selectedPipeline.value = list[0]!.id;
		},
		{ immediate: true },
	);

	// Configuring a NEW detection. One `source` drives it, chosen from three peers:
	// a saved `pipeline`, built-in `labels` (minting a one-shot policy — the
	// no-setup path), or existing `policies`. An optional per-run scope
	// (jurisdictions + languages) applies to any of the three. The matching picker
	// state (selectedPipeline above, labels / policyIds here) feeds whichever
	// source is active.
	const { policies } = usePolicies();
	const newSource = ref<"pipeline" | "labels" | "policies">("pipeline");
	const newLabels = ref<string[]>([]);
	const newPolicyIds = ref<string[]>([]);
	const newCountries = ref<string[]>([]);
	const newLanguages = ref<string[]>([]);

	function resetNewDetection() {
		newSource.value = "pipeline";
		newLabels.value = [];
		newPolicyIds.value = [];
		newCountries.value = [];
		newLanguages.value = [];
	}

	// The optional per-run scope as the SDK `DocumentContext` shape, or undefined
	// when neither jurisdictions nor languages are set.
	const newScope = computed(() => {
		const countries = newCountries.value;
		const languages = newLanguages.value;
		if (!countries.length && !languages.length) return undefined;
		return {
			...(countries.length ? { countries: [...countries] } : {}),
			...(languages.length
				? {
						languages: languages.map((language) => ({
							language,
							source: "asserted" as const,
						})),
					}
				: {}),
		};
	});

	const phase = ref<StudioDetectionPhase>("idle");
	const detectionStatus = ref<WorkspaceDetection["status"] | null>(null);
	const audit = ref<Audit | null>(null);
	const errorMessage = ref("");

	// The detection backing the shown audit — the target for redaction. Set
	// whenever an audit is shown (fresh or restored); cleared when there's none.
	const detectionId = ref<string | null>(null);
	// The active file's display name, so a redacted download gets a sensible name.
	const detectionFileName = ref<string | null>(null);

	// Unified entity stream across modalities (text/tabular from the flat text or
	// DOCX parts; image from the audit's boxes), so the audit list, count, and
	// redaction work the same whether the file is a document or an image.
	const { entities, categorizedGroups, count } = useStudioEntities(
		audit,
		documentText,
		docxParts,
	);

	// The file's detections, newest-first — the list the reviewer picks from. On
	// file open it's fetched and the newest is auto-selected (its audit shown), so
	// opening a file still lands on a result, with the rest a switch away. A new
	// run prepends its detection and selects it.
	const detections = ref<WorkspaceDetection[]>([]);
	const selectedDetectionId = ref<string | null>(null);
	// A load token so a slow `loadAnalysis` for a detection the user has since
	// switched away from (or a file that changed) can't overwrite newer state.
	let loadToken = 0;

	/** Show a specific detection: load its audit and make it the active one. */
	async function loadDetection(id: string) {
		const file = toValue(fileId);
		const row = detections.value.find((d) => d.id === id);
		if (!row) return;
		const token = ++loadToken;
		selectedDetectionId.value = id;
		phase.value = "restoring";
		detectionStatus.value = null;
		errorMessage.value = "";
		audit.value = null;
		detectionId.value = null;
		detectionFileName.value =
			row.inputDocumentName ?? toValue(fileName) ?? null;
		try {
			const loaded = await requireProvider().loadAnalysis(id);
			if (token !== loadToken || toValue(fileId) !== file) return;
			audit.value = loaded;
			detectionId.value = id;
			detectionStatus.value = "complete";
			phase.value = "complete";
		} catch {
			if (token === loadToken) {
				errorMessage.value = t("studio.audit.runFailed");
				phase.value = "failed";
			}
		}
	}

	// The detection source for the chosen kind, or null when nothing runnable is
	// selected yet (no pipeline / no labels / no policies). Scope rides along on
	// the two ad-hoc kinds.
	const activeSource = computed<DetectionSource | null>(() => {
		const scope = newScope.value;
		switch (newSource.value) {
			case "pipeline":
				return selectedPipeline.value
					? {
							kind: "pipeline",
							pipelineId: selectedPipeline.value,
							...(scope && { scope }),
						}
					: null;
			case "labels":
				return newLabels.value.length
					? {
							kind: "labels",
							labels: [...newLabels.value],
							...(scope && { scope }),
						}
					: null;
			case "policies":
				return newPolicyIds.value.length
					? {
							kind: "policy",
							policyIds: [...newPolicyIds.value],
							...(scope && { scope }),
						}
					: null;
		}
	});

	const canRun = computed(
		() =>
			!!toValue(fileId) &&
			!!activeSource.value &&
			phase.value !== "running" &&
			phase.value !== "restoring",
	);

	async function run() {
		const file = toValue(fileId);
		const source = activeSource.value;
		if (!file || !source) return;
		// Supersede any in-flight load, and capture the token so a detection that
		// finishes after the active file changed can't overwrite new state.
		const token = ++loadToken;
		phase.value = "running";
		detectionStatus.value = "pending";
		errorMessage.value = "";
		audit.value = null;
		detectionId.value = null;
		detectionFileName.value = toValue(fileName) ?? null;
		try {
			const result = await requireProvider().produce(
				{
					fileId: file,
					name: toValue(fileName) ?? file,
					source,
					bytes: documentBytes ?? (() => Promise.reject(new Error("no bytes"))),
				},
				(status) => {
					if (token === loadToken)
						detectionStatus.value = status as WorkspaceDetection["status"];
				},
			);
			if (token !== loadToken || toValue(fileId) !== file) return;
			audit.value = result.audit;
			detectionId.value = result.detectionId;
			selectedDetectionId.value = result.detectionId;
			phase.value = "complete";
			// Refresh the list so the new detection appears (and future switches see
			// it); best-effort — the run already shows its own result above.
			void requireProvider()
				.listForFile(file)
				.then((rows) => {
					if (toValue(fileId) === file) detections.value = rows;
				})
				.catch(() => {});

			// Fire a native "detection complete" notification (local events only;
			// the seam's pref check + device gate decide whether it actually shows).
			const name = toValue(fileName) ?? file;
			const count = (result.audit.report.parts ?? []).reduce(
				(total, part) => total + (part.entities?.length ?? 0),
				0,
			);
			notifyLocal("pipeline.detection.completed", {
				title: t("studio.notify.detectionComplete.title"),
				body: t("studio.notify.detectionComplete.body", count, {
					named: { count, name },
				}),
			});
		} catch (err) {
			if (token !== loadToken) return;
			phase.value = "failed";
			errorMessage.value = getErrorMessage(err, t("studio.audit.runFailed"));
			notifyLocal("pipeline.detection.failed", {
				title: t("studio.notify.detectionFailed.title"),
				body: t("studio.notify.detectionFailed.body", {
					name: toValue(fileName) ?? file,
				}),
			});
		}
	}

	/** Clear all shown-detection state (no file, or a file with no detections). */
	function clearShown() {
		phase.value = "idle";
		detectionStatus.value = null;
		errorMessage.value = "";
		audit.value = null;
		detectionId.value = null;
		detectionFileName.value = null;
		selectedDetectionId.value = null;
	}

	// On file open, fetch the file's detections and open the newest (its audit),
	// leaving the rest as a list to switch to. The quick selection is reset so a
	// prior file's ad-hoc choice can't leak into this file's "New detection" form.
	watch(
		() => toValue(fileId),
		async (file) => {
			const token = ++loadToken;
			detections.value = [];
			resetNewDetection();
			if (!file) {
				clearShown();
				return;
			}
			phase.value = "restoring";
			audit.value = null;
			detectionId.value = null;
			try {
				const rows = await requireProvider().listForFile(file);
				if (token !== loadToken || toValue(fileId) !== file) return;
				detections.value = rows;
				const newest = rows[0];
				if (newest) await loadDetection(newest.id);
				else clearShown();
			} catch {
				if (token === loadToken) clearShown();
			}
		},
		{ immediate: true },
	);

	return {
		pipelines,
		selectedPipeline,
		policies,
		// New-detection config: one source + its picker state + optional scope.
		newSource,
		newLabels,
		newPolicyIds,
		newCountries,
		newLanguages,
		// The file's detections + which one is shown, and a switcher.
		detections,
		selectedDetectionId,
		loadDetection,
		phase,
		detectionStatus,
		audit,
		detectionId,
		detectionFileName,
		errorMessage,
		entities,
		categorizedGroups,
		count,
		canRun,
		run,
	};
}
