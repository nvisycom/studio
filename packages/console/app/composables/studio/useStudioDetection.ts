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
 * Owns the studio's detection lifecycle for the active file: the detection
 * source (policies or labels), running a detection, restoring the file's most
 * recent detection, and the flattened entities the document + audit panel
 * render. This is the studio's long-running "job" — a detection can take seconds
 * to minutes — so it's the surface the desktop tray/notifications observe.
 *
 * Redaction (reviewer edits + applying them) is a separate concern; see
 * {@link useStudioRedaction}, which takes this composable's outputs as input.
 *
 * Call this once per studio page and share its result — the detection bar drives
 * the source controls while the audit panel and document overlay read the
 * entities, so both must observe the same state.
 */
export function useStudioDetection(
	fileId: MaybeRefOrGetter<string | null>,
	documentText: MaybeRefOrGetter<string | null>,
	docxParts?: MaybeRefOrGetter<Map<string, Uint8Array> | null>,
	fileName?: MaybeRefOrGetter<string | null>,
	documentBytes?: () => Promise<Uint8Array>,
) {
	const { t } = useI18n();
	// Detection runs through the injected provider: the server flow, or the
	// on-device engine when offline. The provider owns run + restore; this
	// composable owns the source selection, phases, and restore orchestration.
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

	// Configuring a NEW detection. One `source` drives it, chosen from two peers:
	// built-in `labels` (minting a derived policy — the no-setup path) or existing
	// `policies`. An optional per-run scope (jurisdictions + languages) applies to
	// either. The matching picker state (labels / policyIds) feeds whichever source
	// is active. `labels` is the default: it needs no prior setup.
	const { policies } = usePolicies();
	const newSource = ref<"labels" | "policies">("labels");
	const newLabels = ref<string[]>([]);
	const newPolicyIds = ref<string[]>([]);
	const newCountries = ref<string[]>([]);
	const newLanguages = ref<string[]>([]);

	function resetNewDetection() {
		newSource.value = "labels";
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

	/** Fetch and show a completed detection's audit (the `complete` path). */
	async function showAnalysis(id: string, token: number, file: string | null) {
		phase.value = "restoring";
		detectionStatus.value = null;
		errorMessage.value = "";
		audit.value = null;
		detectionId.value = null;
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

	/** Poll a still-pending selected detection until it settles, then show its
	 *  analysis (or its failure). Bounded by the load token so a file/selection
	 *  change cancels it. */
	async function pollPending(id: string, token: number, file: string | null) {
		while (token === loadToken && toValue(fileId) === file) {
			await new Promise((r) => setTimeout(r, 2500));
			if (token !== loadToken || toValue(fileId) !== file) return;
			let rows: WorkspaceDetection[];
			try {
				rows = await requireProvider().listForFile(file ?? "");
			} catch {
				continue; // transient; try again next tick
			}
			if (token !== loadToken || toValue(fileId) !== file) return;
			detections.value = rows;
			const row = rows.find((d) => d.id === id);
			if (!row) return; // gone
			detectionStatus.value = row.status;
			if (row.status === "complete") return showAnalysis(id, token, file);
			if (row.status === "failed") {
				errorMessage.value = t("studio.audit.runFailed");
				phase.value = "failed";
				return;
			}
		}
	}

	/** Show a specific detection: load its audit and make it the active one. A
	 *  completed detection's analysis is fetched; a pending one shows its status
	 *  and is polled until it settles; a failed one shows the failure. This is a
	 *  displayed selection, distinct from a run started via `run()`. */
	async function loadDetection(id: string) {
		const file = toValue(fileId);
		const row = detections.value.find((d) => d.id === id);
		if (!row) return;
		const token = ++loadToken;
		selectedDetectionId.value = id;
		detectionFileName.value =
			row.inputDocumentName ?? toValue(fileName) ?? null;
		detectionStatus.value = row.status;
		if (row.status === "complete") {
			await showAnalysis(id, token, file);
		} else if (row.status === "failed") {
			audit.value = null;
			detectionId.value = null;
			errorMessage.value = t("studio.audit.runFailed");
			phase.value = "failed";
		} else {
			// Pending: show the running state and poll until it settles.
			audit.value = null;
			detectionId.value = null;
			errorMessage.value = "";
			phase.value = "running";
			void pollPending(id, token, file);
		}
	}

	// The detection source for the chosen kind, or null when nothing runnable is
	// selected yet (no labels / no policies). Scope rides along on either kind.
	const activeSource = computed<DetectionSource | null>(() => {
		const scope = newScope.value;
		switch (newSource.value) {
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
			notifyLocal("detection.completed", {
				title: t("studio.notify.detectionComplete.title"),
				body: t("studio.notify.detectionComplete.body", count, {
					named: { count, name },
				}),
			});
		} catch (err) {
			if (token !== loadToken) return;
			phase.value = "failed";
			errorMessage.value = getErrorMessage(err, t("studio.audit.runFailed"));
			notifyLocal("detection.failed", {
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
				// Auto-open the newest COMPLETED detection (rows are newest-first), so
				// opening a file lands on an audit, not a pending/failed row with no
				// analysis. Fall back to the newest of any status so the switcher still
				// reflects a selection; `loadDetection` shows its status in that case.
				const target = rows.find((d) => d.status === "complete") ?? rows[0];
				if (target) await loadDetection(target.id);
				else clearShown();
			} catch {
				if (token === loadToken) clearShown();
			}
		},
		{ immediate: true },
	);

	return {
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
