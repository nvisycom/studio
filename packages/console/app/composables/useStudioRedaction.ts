import type { EditSet, TextLocation } from "@nvisy/sdk/datatypes";
import type { Ref } from "vue";
import { toast } from "vue-sonner";
import type { TextEntityView } from "#console/composables/useTextEntities";
import type { StudioDetectionPhase } from "#console/composables/useStudioDetection";

/** Lifecycle of applying redactions to a complete detection. */
export type StudioRedactPhase = "idle" | "redacting" | "done" | "failed";

/** The redacted output file a redaction produced, ready to download. */
export interface RedactionOutput {
	fileId: string;
	fileName: string;
}

/**
 * The raw-source part byte span a DOCX add carries (`TextLocation.source`).
 * DOCX has no flat decoded stream on the client, so a reviewer's selection is
 * located by the exact raw bytes it covers in its container part (usually
 * `word/document.xml`). Absent for flat-text adds, whose {@link AddedEntity}
 * `byteStart`/`byteEnd` already index the shown file (→ `location.range`).
 */
export interface AddedSource {
	part: string;
	start: number;
	end: number;
}

/**
 * An entity the reviewer added by selecting text — a span the detection missed.
 * `id` is a stable client key (for the document highlight + focus); the byte
 * offsets locate it in the source; `text` is the selected value, for display.
 * For DOCX, `source` carries the raw part byte span the redaction targets.
 */
export interface AddedEntity {
	id: string;
	label: string;
	byteStart: number;
	byteEnd: number;
	text: string;
	source?: AddedSource;
}

/** The document-selection payload the reviewer confirms into an {@link AddedEntity}. */
export interface AddEntityInput {
	byteStart: number;
	byteEnd: number;
	label: string;
	text: string;
	/** Raw part byte span, for a DOCX add (see {@link AddedSource}). */
	source?: AddedSource;
}

/**
 * A text selection captured for the "add entity" flow, frozen while its popover
 * is open (independent of the live browser selection): the byte span to redact,
 * the selected text (for display), and the viewport rect to anchor the popover.
 * `source` is the raw part byte span for a DOCX selection (see {@link AddedSource}).
 */
export interface PendingAdd {
	byteStart: number;
	byteEnd: number;
	text: string;
	rect: DOMRect;
	source?: AddedSource;
}

/** The detection state a redaction applies to (from {@link useStudioDetection}). */
export interface RedactionTarget {
	phase: Ref<StudioDetectionPhase>;
	detectionId: Ref<string | null>;
	detectionFileName: Ref<string | null>;
	entities: Ref<TextEntityView[]>;
	count: Ref<number>;
}

/**
 * Owns the reviewer-edit + redaction side of the studio, applied to a complete
 * detection: the entities kept (suppressed) or added, applying them to produce a
 * redacted output file, and downloading it. Detection is a separate concern (see
 * {@link useStudioDetection}); this reads that detection's state via `target`.
 *
 * Edits and any produced/restored output reset whenever the target detection
 * changes, so nothing leaks across files or detections.
 */
export function useStudioRedaction(target: RedactionTarget) {
	const { t } = useI18n();
	const { resolveLabel } = useLabels();
	const {
		createRedaction,
		findLatestForDetection: findLatestRedaction,
		downloadOutput,
	} = useRedactions();

	const { phase, detectionId, detectionFileName, entities, count } = target;

	// Redaction lifecycle for the current detection, and the redacted output it
	// produced (present once done, so the UI can offer a download).
	const redactPhase = ref<StudioRedactPhase>("idle");
	const redactError = ref("");
	const output = ref<RedactionOutput | null>(null);

	// Ids of entities the reviewer chose to keep (suppress from redaction).
	const suppressed = ref<Set<string>>(new Set());
	// Entities the reviewer added by selecting text — a stable id (for the
	// document highlight + focus), a label + byte span, and the selected text for
	// display, to redact what the detection missed. Text-modality only (plain
	// text) for now.
	let nextAddedId = 0;
	const added = ref<AddedEntity[]>([]);
	// Bumped whenever the edit set changes. A redaction captures it at the start
	// and only publishes its output if it still matches — so an edit made while a
	// redaction is in flight can't be overwritten by that now-stale result.
	let editRevision = 0;

	function resetEdits() {
		suppressed.value = new Set();
		added.value = [];
		nextAddedId = 0;
		editRevision++;
	}

	function resetRedaction() {
		redactPhase.value = "idle";
		redactError.value = "";
		output.value = null;
	}

	// An edit makes any existing or in-flight redaction stale: its output no
	// longer matches the displayed edit set. Bump the revision (so `redact`'s
	// guard discards a result already in flight) and drop the phase back to
	// not-yet-applied, so the reviewer re-runs rather than downloading — or waiting
	// on — a redaction that doesn't match. "idle" needs no reset.
	function invalidateOutput() {
		editRevision++;
		if (redactPhase.value !== "idle") {
			resetRedaction();
		}
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
		invalidateOutput();
	}

	/** Add a reviewer-marked entity (a byte span + label + shown text) to redact. */
	function addEntity(input: AddEntityInput) {
		added.value = [...added.value, { id: `added:${nextAddedId++}`, ...input }];
		invalidateOutput();
	}

	/** Drop a previously added entity by its index. */
	function removeAdded(index: number) {
		added.value = added.value.filter((_, i) => i !== index);
		invalidateOutput();
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
			added: true,
			// A DOCX add carries its raw part byte span; expose it as a source ref so
			// the DOCX preview highlights it through the same run resolver as detected
			// entities (flat-text adds highlight off start/end and need none).
			...(a.source
				? {
						sourceRefs: [
							{ part: a.source.part, start: a.source.start, end: a.source.end },
						],
					}
				: {}),
		})),
	);

	// Entities the document highlights: everything detected plus the reviewer's
	// additions, each flagged with its suppressed state so a kept entity's chip
	// dims (it won't be redacted). The audit panel keeps its own detected-vs-added
	// split; this is only for the in-document overlay.
	const highlightEntities = computed<TextEntityView[]>(() =>
		[...entities.value, ...addedEntities.value].map((e) => ({
			...e,
			suppressed: suppressed.value.has(e.id),
		})),
	);

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
			// `range` carries the add's byte span. For a flat-text add (plain text /
			// JSON) that's the document byte offset, exactly as detected entities
			// carry it. For a DOCX add there's no flat decoded stream to offset into,
			// so `source` carries the raw part byte span the apply path reads; the
			// span's raw bytes double as `range` (byteStart/byteEnd are set from it).
			const location: TextLocation = {
				range: { start: a.byteStart, end: a.byteEnd },
			};
			if (a.source) {
				location.source = [
					{
						part: a.source.part,
						range: { start: a.source.start, end: a.source.end },
					},
				];
			}
			text.push({ op: "add", label: a.label, location });
		}
		const set: EditSet = {};
		if (text.length) set.text = text;
		if (tabular.length) set.tabular = tabular;
		return text.length || tabular.length ? set : undefined;
	}

	// Redaction is offered once a detection is complete (and isn't already
	// redacting).
	const canRedact = computed(
		() =>
			phase.value === "complete" &&
			!!detectionId.value &&
			redactPhase.value !== "redacting",
	);

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
	 * result (the target detection changed mid-request) can't overwrite newer state.
	 */
	async function redact() {
		const detection = detectionId.value;
		if (!detection || redactPhase.value === "redacting") return;
		// Capture the edit set this run is for; if the reviewer edits mid-request,
		// the revision moves and we drop the now-stale result.
		const revision = editRevision;
		redactPhase.value = "redacting";
		redactError.value = "";
		try {
			const result = await createRedaction(detection, buildEditSet());
			// The target detection changed, or the edits moved on — drop this stale
			// result rather than publishing output that doesn't match the panel.
			if (detectionId.value !== detection || editRevision !== revision) return;
			if (!result.outputFileId)
				throw new Error("The redaction produced no output file.");
			output.value = {
				fileId: result.outputFileId,
				fileName: redactedName(result.outputFileId),
			};
			redactPhase.value = "done";
		} catch (err) {
			if (detectionId.value !== detection || editRevision !== revision) return;
			redactPhase.value = "failed";
			redactError.value = getErrorMessage(err, t("studio.audit.redactFailed"));
		}
	}

	/** Download the redacted output file produced by {@link redact}. */
	async function downloadRedacted() {
		if (!output.value) return;
		try {
			await downloadOutput(output.value.fileId, output.value.fileName);
		} catch (err) {
			// On desktop the native save can fail after the panel closes (e.g. the
			// target dir is unwritable); surface it instead of an unhandled reject.
			toast.error(t("studio.audit.downloadFailed"), {
				description: getErrorMessage(err, t("common.errors.tryAgain")),
			});
		}
	}

	// Whenever the target detection changes, reset edits + output and — for a
	// detection that already has a redaction on the server — restore its output so
	// the panel offers the download without re-running. Guarded against a detection
	// that changes again mid-lookup.
	watch(
		detectionId,
		async (id) => {
			resetEdits();
			resetRedaction();
			if (!id) return;
			try {
				const redaction = await findLatestRedaction(id);
				if (detectionId.value !== id) return;
				if (redaction?.outputFileId) {
					output.value = {
						fileId: redaction.outputFileId,
						fileName: redactedName(redaction.outputFileId),
					};
					redactPhase.value = "done";
				}
			} catch {
				// No restorable redaction; leave it as not-yet-applied.
			}
		},
		{ immediate: true },
	);

	return {
		redactPhase,
		redactError,
		output,
		canRedact,
		redact,
		downloadRedacted,
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
