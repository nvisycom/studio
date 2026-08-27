import type { Audit, Detection, EditSet } from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";
import type { TextEntityView } from "#console/composables/useTextEntities";

/** Lifecycle phase of the studio's detection. `complete` = analysis ready. */
export type StudioAuditPhase =
	| "idle"
	| "restoring"
	| "running"
	| "complete"
	| "failed";

/** Lifecycle of applying redactions to a complete detection. */
export type StudioRedactPhase = "idle" | "redacting" | "done" | "failed";

/** The redacted output file a redaction produced, ready to download. */
export interface RedactionOutput {
	fileId: string;
	fileName: string;
}

/**
 * An entity the reviewer added by selecting text — a span the detection missed.
 * `id` is a stable client key (for the document highlight + focus); the byte
 * offsets locate it in the source; `text` is the selected value, for display.
 */
export interface AddedEntity {
	id: string;
	label: string;
	byteStart: number;
	byteEnd: number;
	text: string;
}

/** The document-selection payload the reviewer confirms into an {@link AddedEntity}. */
export interface AddEntityInput {
	byteStart: number;
	byteEnd: number;
	label: string;
	text: string;
}

/**
 * A text selection captured for the "add entity" flow, frozen while its popover
 * is open (independent of the live browser selection): the byte span to redact,
 * the selected text (for display), and the viewport rect to anchor the popover.
 */
export interface PendingAdd {
	byteStart: number;
	byteEnd: number;
	text: string;
	rect: DOMRect;
}

/**
 * Owns the studio's detection + audit lifecycle for the active file: the
 * pipeline choice, running detection, restoring the file's most recent detection, and
 * the flattened entities the document + audit panel render.
 *
 * Call this once per studio page and share its result — the detection bar drives the
 * pipeline/detection controls while the audit panel and document overlay read the
 * entities, so both must observe the same state.
 */
export function useStudioAudit(
	fileId: MaybeRefOrGetter<string | null>,
	documentText: MaybeRefOrGetter<string | null>,
	docxParts?: MaybeRefOrGetter<Map<string, Uint8Array> | null>,
	fileName?: MaybeRefOrGetter<string | null>,
) {
	const { t } = useI18n();
	const { pipelines } = usePipelines();
	const { resolveLabel } = useLabels();
	const { runDetection, findLatestForFile, getAnalysis } = useDetections();
	const {
		createRedaction,
		findLatestForDetection: findLatestRedaction,
		downloadOutput,
	} = useRedactions();

	const selectedPipeline = ref<string>("");
	// The last value we set on `selectedPipeline` programmatically (default or
	// adoption). The pipeline watcher runs asynchronously — after the sync block
	// that set the value — so a boolean flag reset synchronously wouldn't span it.
	// Instead we record the value and have the watcher skip a restore when the new
	// selection equals it (i.e. it wasn't a user switch).
	let programmaticPipeline: string | null = null;

	// The pipeline of the file's most recent detection, to adopt into the picker. Held
	// separately because the detection can resolve before the pipeline list loads; once
	// the list is present, this wins over the "first pipeline" default so a
	// refresh restores the file's own pipeline rather than resetting to the first.
	const pendingAdoptPipeline = ref<string | null>(null);
	// Whether the file-open restore has decided on adoption yet. We hold off the
	// "first pipeline" default until it has, so the picker doesn't briefly show
	// the wrong pipeline and then flicker to the adopted one. With no file open,
	// there's nothing to adopt, so it's resolved immediately.
	const adoptResolved = ref(!toValue(fileId));

	// Pick the selected pipeline once the list loads (or the pending adoption
	// arrives): the file's latest-detection pipeline when known and still valid, else —
	// only once adoption has resolved — the first pipeline. Only sets a default
	// when nothing is selected yet.
	watch(
		[pipelines, pendingAdoptPipeline, adoptResolved],
		([list, adopt, resolved]) => {
			if (!list?.length) return;
			const target =
				adopt && list.some((p) => p.slug === adopt)
					? adopt
					: resolved && !selectedPipeline.value
						? list[0]!.slug
						: null;
			if (target && target !== selectedPipeline.value) {
				// Mark as programmatic so the pipeline watcher doesn't treat it as a
				// user switch (which would start a competing/wrong restore).
				programmaticPipeline = target;
				selectedPipeline.value = target;
			}
		},
		{ immediate: true },
	);

	const phase = ref<StudioAuditPhase>("idle");
	// Restore token: bumped whenever a restore starts so an in-flight restore can
	// tell it has been superseded (file or pipeline changed) and bail.
	let restoreToken = 0;
	// True when the shown audit came from a prior detection (restored on file
	// open) rather than one started in this session.
	const restored = ref(false);
	const detectionStatus = ref<Detection["status"] | null>(null);
	const audit = ref<Audit | null>(null);
	const errorMessage = ref("");

	// The detection backing the shown audit — the target for redaction. Set
	// whenever an audit is shown (fresh or restored); cleared when there's none.
	const detectionId = ref<string | null>(null);
	// The active file's display name, so a redacted download gets a sensible name.
	const detectionFileName = ref<string | null>(null);

	// Redaction lifecycle for the current detection, and the redacted output it
	// produced (present once done, so the UI can offer a download).
	const redactPhase = ref<StudioRedactPhase>("idle");
	const redactError = ref("");
	const output = ref<RedactionOutput | null>(null);

	const { entities, categorizedGroups, count } = useTextEntities(
		audit,
		documentText,
		docxParts,
	);

	// Ids of entities the reviewer chose to keep (suppress from redaction).
	// Cleared whenever a new audit is shown (a fresh run or a restore), so edits
	// never leak across files or detections.
	const suppressed = ref<Set<string>>(new Set());
	// Entities the reviewer added by selecting text — a stable id (for the
	// document highlight + focus), a label + byte span, and the selected text for
	// display, to redact what the detection missed. Text-modality only (plain
	// text) for now.
	let nextAddedId = 0;
	const added = ref<AddedEntity[]>([]);

	function resetEdits() {
		suppressed.value = new Set();
		added.value = [];
		nextAddedId = 0;
	}

	/** Whether an entity is kept (excluded from redaction). */
	function isSuppressed(id: string): boolean {
		return suppressed.value.has(id);
	}

	// Reassign a fresh Set so computeds re-evaluate (Vue doesn't track Set adds).
	function toggleSuppress(id: string) {
		const next = new Set(suppressed.value);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		suppressed.value = next;
	}

	/** Add a reviewer-marked entity (a byte span + label + shown text) to redact. */
	function addEntity(input: AddEntityInput) {
		added.value = [...added.value, { id: `added:${nextAddedId++}`, ...input }];
	}

	/** Drop a previously added entity by its index. */
	function removeAdded(index: number) {
		added.value = added.value.filter((_, i) => i !== index);
	}

	const suppressedCount = computed(
		() => entities.value.filter((e) => suppressed.value.has(e.id)).length,
	);
	/**
	 * How many entities the redaction will actually redact: detected entities
	 * (minus kept ones) plus the ones the reviewer added.
	 */
	const effectiveRedactCount = computed(
		() => count.value - suppressedCount.value + added.value.length,
	);

	// Reviewer-added entities as highlight-ready views, so the document preview
	// marks them with the same chip treatment as detected ones (colored by the
	// label's category). Their id is a stable synthetic key, not a server id.
	const addedEntities = computed<TextEntityView[]>(() =>
		added.value.map((a) => ({
			id: a.id,
			modality: "text",
			label: a.label,
			category: resolveLabel(a.label)?.category ?? null,
			start: a.byteStart,
			end: a.byteEnd,
			confidence: 1,
			text: a.text,
		})),
	);

	// Entities the document highlights: everything detected plus the reviewer's
	// additions. The audit panel keeps its own detected-vs-added split; this is
	// only for the in-document overlay.
	const highlightEntities = computed<TextEntityView[]>(() => [
		...entities.value,
		...addedEntities.value,
	]);

	// Assemble the reviewer edits into the redaction EditSet: a `suppress` edit
	// per kept entity (bucketed by modality) and an `add` edit per reviewer-marked
	// span (text-modality). Returns undefined when there are no edits, so the
	// redact call omits `edits` (redact exactly as detected).
	function buildEditSet(): EditSet | undefined {
		if (suppressed.value.size === 0 && added.value.length === 0)
			return undefined;
		const text: NonNullable<EditSet["text"]> = [];
		const tabular: NonNullable<EditSet["tabular"]> = [];
		for (const entity of entities.value) {
			if (!suppressed.value.has(entity.id)) continue;
			const bucket = entity.modality === "tabular" ? tabular : text;
			bucket.push({ op: "suppress", id: entity.id });
		}
		for (const a of added.value) {
			text.push({
				op: "add",
				label: a.label,
				location: { range: { start: a.byteStart, end: a.byteEnd } },
			});
		}
		const set: EditSet = {};
		if (text.length) set.text = text;
		if (tabular.length) set.tabular = tabular;
		return text.length || tabular.length ? set : undefined;
	}

	const canRun = computed(
		() =>
			!!toValue(fileId) &&
			!!selectedPipeline.value &&
			phase.value !== "running" &&
			phase.value !== "restoring",
	);

	// Redaction is offered once a detection is complete (and isn't already
	// redacting).
	const canRedact = computed(
		() =>
			phase.value === "complete" &&
			!!detectionId.value &&
			redactPhase.value !== "redacting",
	);

	function resetRedaction() {
		redactPhase.value = "idle";
		redactError.value = "";
		output.value = null;
	}

	// The download name for a redacted output: the input's name tagged `.redacted`
	// (keeping its extension so it still opens), falling back to the file id.
	function redactedName(fileId: string): string {
		const base = detectionFileName.value;
		if (!base) return fileId;
		const dot = base.lastIndexOf(".");
		return dot > 0
			? `${base.slice(0, dot)}.redacted${base.slice(dot)}`
			: `${base}.redacted`;
	}

	/**
	 * Apply redactions to the complete detection, producing its redacted output
	 * file. On success `output` carries the file to download; guarded so a stale
	 * result (the active file changed mid-request) can't overwrite newer state.
	 */
	async function redact() {
		const target = detectionId.value;
		if (!target || redactPhase.value === "redacting") return;
		const token = restoreToken;
		redactPhase.value = "redacting";
		redactError.value = "";
		try {
			const result = await createRedaction(target, buildEditSet());
			if (token !== restoreToken) return;
			if (!result.outputFileId)
				throw new Error("The redaction produced no output file.");
			output.value = {
				fileId: result.outputFileId,
				fileName: redactedName(result.outputFileId),
			};
			redactPhase.value = "done";
		} catch (err) {
			if (token !== restoreToken) return;
			redactPhase.value = "failed";
			redactError.value = getErrorMessage(err, t("studio.audit.redactFailed"));
		}
	}

	/** Download the redacted output file produced by {@link redact}. */
	async function downloadRedacted() {
		if (!output.value) return;
		await downloadOutput(output.value.fileId, output.value.fileName);
	}

	async function run() {
		const file = toValue(fileId);
		if (!file || !selectedPipeline.value) return;
		// Supersede any in-flight restore, and capture the token so a detection
		// that finishes after the active file changed can't overwrite new state.
		const token = ++restoreToken;
		phase.value = "running";
		detectionStatus.value = "pending";
		restored.value = false;
		errorMessage.value = "";
		audit.value = null;
		detectionId.value = null;
		detectionFileName.value = toValue(fileName) ?? null;
		resetRedaction();
		resetEdits();
		try {
			const result = await runDetection(
				selectedPipeline.value,
				{ fileId: file },
				(status) => {
					if (token === restoreToken) detectionStatus.value = status;
				},
			);
			if (token !== restoreToken) return;
			audit.value = result.audit;
			detectionId.value = result.detectionId;
			phase.value = "complete";
		} catch (err) {
			if (token !== restoreToken) return;
			phase.value = "failed";
			errorMessage.value = getErrorMessage(err, t("studio.audit.runFailed"));
		}
	}

	// Restore the most recent detection for a file — it still lives on the server
	// even if the tab was closed. When `pipelineSlug` is given, restore that
	// pipeline's latest detection; otherwise the file's latest of any pipeline,
	// adopting its pipeline into the picker (`adopt`). Best-effort: falls back to
	// idle when nothing is found or the request is superseded.
	async function restoreLatest(
		file: string,
		opts: { pipelineSlug?: string; adopt?: boolean } = {},
	) {
		const token = ++restoreToken;
		phase.value = "restoring";
		detectionStatus.value = null;
		restored.value = false;
		errorMessage.value = "";
		audit.value = null;
		detectionId.value = null;
		detectionFileName.value = toValue(fileName) ?? null;
		resetRedaction();
		resetEdits();
		try {
			const latest = await findLatestForFile(file, opts.pipelineSlug);
			// Bail if a newer restore started (file or pipeline changed) meanwhile.
			if (token !== restoreToken) return;
			if (!latest) {
				// Adoption decided: no detection for this file, so the default may apply.
				if (opts.adopt) adoptResolved.value = true;
				phase.value = "idle";
				return;
			}
			// Record the detection's pipeline to adopt into the picker, and mark
			// adoption resolved so the selection watcher applies it (never the default).
			if (opts.adopt) {
				pendingAdoptPipeline.value = latest.pipelineSlug;
				adoptResolved.value = true;
			}
			const restoredAudit = await getAnalysis(latest.id);
			if (token !== restoreToken) return;
			audit.value = restoredAudit;
			detectionId.value = latest.id;
			detectionStatus.value = latest.status;
			restored.value = true;
			phase.value = "complete";
			// If this detection was already redacted, surface its output so the
			// panel offers the download without re-running redaction. Isolated: a
			// failed lookup just means "no restorable redaction" and must not undo
			// the audit we already restored above.
			try {
				const redaction = await findLatestRedaction(latest.id);
				if (token !== restoreToken) return;
				if (redaction?.outputFileId) {
					output.value = {
						fileId: redaction.outputFileId,
						fileName: redactedName(redaction.outputFileId),
					};
					redactPhase.value = "done";
				}
			} catch {
				// Leave redaction as not-yet-applied; the audit stays restored.
			}
		} catch {
			if (token === restoreToken) {
				if (opts.adopt) adoptResolved.value = true; // don't block the default
				phase.value = "idle";
			}
		}
	}

	// On file open, restore the file's most recent detection and adopt its pipeline, so
	// opening a file shows its latest audit under the pipeline that produced it.
	watch(
		() => toValue(fileId),
		(file) => {
			// Reset per-file pipeline state so the prior file's choice can't leak:
			// clear the pending adoption, and clear the selection (programmatically,
			// so the pipeline watcher doesn't treat it as a user switch) so the
			// selection watcher can re-pick this file's adopted or default pipeline.
			pendingAdoptPipeline.value = null;
			if (selectedPipeline.value) {
				programmaticPipeline = "";
				selectedPipeline.value = "";
			}
			if (!file) {
				++restoreToken; // supersede any in-flight restore
				adoptResolved.value = true; // nothing to adopt → default may apply
				phase.value = "idle";
				detectionStatus.value = null;
				restored.value = false;
				errorMessage.value = "";
				audit.value = null;
				detectionId.value = null;
				detectionFileName.value = null;
				resetRedaction();
				resetEdits();
				return;
			}
			// Wait for this file's restore before defaulting, so the picker doesn't
			// flicker through the wrong pipeline.
			adoptResolved.value = false;
			restoreLatest(file, { adopt: true });
		},
		{ immediate: true },
	);

	// When the user switches the pipeline, restore that pipeline's latest audit
	// for the current file. A programmatic selection (default or adoption) sets
	// `programmaticPipeline` to the same value and is skipped — the file-open flow
	// already handles its restore, so we don't start a competing/wrong one.
	watch(selectedPipeline, (pipeline) => {
		if (pipeline === programmaticPipeline) {
			programmaticPipeline = null; // consume; further changes are user switches
			return;
		}
		// A manual switch overrides any pending adoption for this file.
		pendingAdoptPipeline.value = null;
		const file = toValue(fileId);
		if (file && pipeline) restoreLatest(file, { pipelineSlug: pipeline });
	});

	return {
		pipelines,
		selectedPipeline,
		phase,
		restored,
		detectionStatus,
		audit,
		errorMessage,
		entities,
		categorizedGroups,
		count,
		canRun,
		run,
		// Redaction
		redactPhase,
		redactError,
		output,
		canRedact,
		redact,
		downloadRedacted,
		// Reviewer edits
		suppressed,
		isSuppressed,
		toggleSuppress,
		added,
		addEntity,
		removeAdded,
		highlightEntities,
		suppressedCount,
		effectiveRedactCount,
	};
}
