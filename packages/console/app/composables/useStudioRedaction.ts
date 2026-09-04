import type {
	AudioLocation,
	EditSet,
	ImageLocation,
	TextCoord,
	TextLocation,
} from "@nvisy/sdk/datatypes";
import type { Ref } from "vue";
import { toast } from "vue-sonner";
import type { TextEntityView } from "#console/composables/useTextEntities";
import type { ImageEntityView } from "#console/composables/useImageEntities";
import type { AudioEntityView } from "#console/composables/useAudioEntities";
import type { StudioEntityView } from "#console/composables/useStudioEntities";
import type { StudioDetectionPhase } from "#console/composables/useStudioDetection";

/** Lifecycle of applying redactions to a complete detection. */
export type StudioRedactPhase = "idle" | "redacting" | "done" | "failed";

/** The redacted output file a redaction produced, ready to download. */
export interface RedactionOutput {
	fileId: string;
	fileName: string;
}

/**
 * The raw-source part byte span a DOCX add carries (a `source`-only text coord).
 * DOCX has no flat decoded stream on the client, so a reviewer's selection is
 * located by the exact raw bytes it covers in its container part (usually
 * `word/document.xml`). Absent for flat-text adds, whose {@link AddedTextEntity}
 * `byteStart`/`byteEnd` already index the shown file (→ a `decoded` coord).
 */
export interface AddedSource {
	part: string;
	start: number;
	end: number;
}

/**
 * A `source`-only text coord for a DOCX add: the reviewer selected rendered
 * text, so there's no decoded stream to offset into. The apply path
 * reverse-resolves the entity from this raw part byte range.
 */
function sourceCoord(source: AddedSource): TextCoord {
	return {
		kind: "source",
		source: [
			{ part: source.part, range: { start: source.start, end: source.end } },
		],
	};
}

/**
 * A `decoded` text coord for a flat-text add (plain text / JSON): the reviewer's
 * byte offsets index the shown, decoded document directly.
 */
function decodedCoord(byteStart: number, byteEnd: number): TextCoord {
	return { kind: "decoded", range: { start: byteStart, end: byteEnd } };
}

/**
 * An entity the reviewer added by selecting text — a span the detection missed.
 * `id` is a stable client key (for the document highlight + focus); the byte
 * offsets locate it in the source; `text` is the selected value, for display.
 * For DOCX, `source` carries the raw part byte span the redaction targets.
 */
export interface AddedTextEntity {
	id: string;
	label: string;
	byteStart: number;
	byteEnd: number;
	text: string;
	source?: AddedSource;
}

/** The document-selection payload the reviewer confirms into an {@link AddedTextEntity}. */
export interface AddTextEntityInput {
	byteStart: number;
	byteEnd: number;
	label: string;
	text: string;
	/** Raw part byte span, for a DOCX add (see {@link AddedSource}). */
	source?: AddedSource;
}

/** A bounding box in an image's natural pixel coordinates. */
export interface AddImageBox {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

/**
 * An image entity the reviewer added by drawing a box — a region the detection
 * missed. `id` is a stable client key (for the overlay + focus); `box` locates it
 * in the image's natural pixel coordinates; `label` is what the reviewer marked it.
 */
export interface AddedImageEntity {
	id: string;
	label: string;
	box: AddImageBox;
}

/** The drawn-box payload the reviewer confirms into an {@link AddedImageEntity}. */
export interface AddImageEntityInput {
	label: string;
	box: AddImageBox;
}

/** A time span in an audio stream, in seconds from the start. */
export interface AddAudioSpan {
	start: number;
	end: number;
}

/**
 * An audio entity the reviewer added by selecting a time span — a stretch the
 * detection missed. `id` is a stable client key; `span` locates it (seconds);
 * `label` is what the reviewer marked it.
 */
export interface AddedAudioEntity {
	id: string;
	label: string;
	span: AddAudioSpan;
}

/** The selected-span payload the reviewer confirms into an {@link AddedAudioEntity}. */
export interface AddAudioEntityInput {
	label: string;
	span: AddAudioSpan;
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
	/** Detected entities of the audit's modality (text/tabular or image). */
	entities: Ref<StudioEntityView[]>;
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
	const addedTexts = ref<AddedTextEntity[]>([]);
	// Image entities the reviewer added by drawing a box (region the detection
	// missed) — image-modality adds, kept separate from the text-shaped `added`.
	const addedImages = ref<AddedImageEntity[]>([]);
	// Audio entities the reviewer added by selecting a waveform time span.
	const addedAudios = ref<AddedAudioEntity[]>([]);
	// Span overrides for *detected* audio entities the reviewer adjusted (dragged a
	// region edge): entity id -> corrected span (seconds). Emitted as `retag` edits.
	// Added entities aren't here — their own span is mutated in place.
	const audioSpanOverrides = ref<Map<string, AddAudioSpan>>(new Map());
	// Bumped whenever the edit set changes. A redaction captures it at the start
	// and only publishes its output if it still matches — so an edit made while a
	// redaction is in flight can't be overwritten by that now-stale result.
	let editRevision = 0;

	function resetEdits() {
		suppressed.value = new Set();
		addedTexts.value = [];
		addedImages.value = [];
		addedAudios.value = [];
		audioSpanOverrides.value = new Map();
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

	// Added-entity ids carry a per-modality prefix so a single `removeAdded(id)` can
	// route to the right list. Text uses the bare `added:` prefix (image/audio add
	// their tag after it), so match the more specific prefixes first.
	const IMAGE_ADD_PREFIX = "added:img:";
	const AUDIO_ADD_PREFIX = "added:aud:";

	/** Add a reviewer-marked text entity (a byte span + label + shown text). */
	function addTextEntity(input: AddTextEntityInput) {
		addedTexts.value = [
			...addedTexts.value,
			{ id: `added:${nextAddedId++}`, ...input },
		];
		invalidateOutput();
	}

	/** Add a reviewer-drawn image region (a box + label) to redact. */
	function addImageEntity(input: AddImageEntityInput) {
		addedImages.value = [
			...addedImages.value,
			{ id: `${IMAGE_ADD_PREFIX}${nextAddedId++}`, ...input },
		];
		invalidateOutput();
	}

	/** Add a reviewer-selected audio span (a time span + label) to redact. */
	function addAudioEntity(input: AddAudioEntityInput) {
		addedAudios.value = [
			...addedAudios.value,
			{ id: `${AUDIO_ADD_PREFIX}${nextAddedId++}`, ...input },
		];
		invalidateOutput();
	}

	/** Drop a previously added entity by its id (text, image, or audio). */
	function removeAdded(id: string) {
		if (id.startsWith(IMAGE_ADD_PREFIX)) {
			addedImages.value = addedImages.value.filter((a) => a.id !== id);
		} else if (id.startsWith(AUDIO_ADD_PREFIX)) {
			addedAudios.value = addedAudios.value.filter((a) => a.id !== id);
		} else {
			addedTexts.value = addedTexts.value.filter((a) => a.id !== id);
		}
		invalidateOutput();
	}

	/**
	 * Adjust an audio entity's span (the reviewer dragged a region edge). An added
	 * entity's own span is mutated in place; a detected entity's corrected span is
	 * recorded as an override that `buildEditSet` emits as a `retag` edit.
	 */
	function retagAudioSpan(id: string, span: AddAudioSpan) {
		if (id.startsWith(AUDIO_ADD_PREFIX)) {
			addedAudios.value = addedAudios.value.map((a) =>
				a.id === id ? { ...a, span } : a,
			);
		} else {
			const next = new Map(audioSpanOverrides.value);
			next.set(id, span);
			audioSpanOverrides.value = next;
		}
		invalidateOutput();
	}

	const suppressedCount = computed(
		() => entities.value.filter((e) => suppressed.value.has(e.id)).length,
	);
	/**
	 * How many entities the redaction will actually redact: detected entities
	 * (minus kept ones) plus the ones the reviewer added (text spans, image boxes,
	 * audio spans).
	 */
	const effectiveRedactCount = computed(
		() =>
			count.value -
			suppressedCount.value +
			addedTexts.value.length +
			addedImages.value.length +
			addedAudios.value.length,
	);

	// Reviewer-added entities as highlight-ready views, so the document preview
	// marks them with the same chip treatment as detected ones (colored by the
	// label's category). Their id is a stable synthetic key, not a server id.
	const addedTextEntities = computed<TextEntityView[]>(() =>
		addedTexts.value.map((a) => ({
			id: a.id,
			modality: "text",
			label: a.label,
			category: resolveLabel(a.label)?.category ?? null,
			start: a.byteStart,
			end: a.byteEnd,
			// A DOCX add is source-only (its byte offsets are raw part bytes, not a
			// decoded document position); a flat-text add's offsets are decoded.
			decoded: !a.source,
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

	// Detected text/tabular entities (the audit is one modality; image/audio go to
	// their own overlays). Narrowed off the union by the text modalities explicitly
	// — a `!== "image"` check would wrongly capture audio too.
	const detectedTextEntities = computed<TextEntityView[]>(() =>
		entities.value.filter(
			(e): e is TextEntityView =>
				e.modality === "text" || e.modality === "tabular",
		),
	);

	// Text entities the document highlights: the detected text/tabular ones plus the
	// reviewer's text additions, each flagged with its suppressed state so a kept
	// entity's chip dims (it won't be redacted). This drives the text/DOCX/CSV
	// overlay; the audit panel keeps its own detected-vs-added split.
	const highlightTextEntities = computed<TextEntityView[]>(() =>
		[...detectedTextEntities.value, ...addedTextEntities.value].map((e) => ({
			...e,
			suppressed: suppressed.value.has(e.id),
		})),
	);

	// Reviewer-added image regions as overlay-ready views, so the image preview
	// draws them with the same box treatment as detected image entities.
	const addedImageEntities = computed<ImageEntityView[]>(() =>
		addedImages.value.map((a) => ({
			id: a.id,
			modality: "image",
			label: a.label,
			category: resolveLabel(a.label)?.category ?? null,
			confidence: 1,
			box: a.box,
			added: true,
		})),
	);

	// Image entities the preview overlays: detected image boxes (from the audit)
	// plus the reviewer's drawn boxes, each flagged with its suppressed state so a
	// kept box dims. Detected image entities are narrowed off the union.
	const highlightImageEntities = computed<ImageEntityView[]>(() => {
		const detected = entities.value.filter(
			(e): e is ImageEntityView => e.modality === "image",
		);
		return [...detected, ...addedImageEntities.value].map((e) => ({
			...e,
			suppressed: suppressed.value.has(e.id),
		}));
	});

	// Reviewer-added audio spans as views, so the waveform overlay + the audit list
	// treat them like detected audio entities.
	const addedAudioEntities = computed<AudioEntityView[]>(() =>
		addedAudios.value.map((a) => ({
			id: a.id,
			modality: "audio",
			label: a.label,
			category: resolveLabel(a.label)?.category ?? null,
			confidence: 1,
			span: a.span,
			added: true,
		})),
	);

	// Audio entities the waveform overlays: detected spans (from the audit) plus the
	// reviewer's added spans, suppress-flagged, with any span override applied so the
	// region shows the adjusted bounds. Detected audio entities are narrowed off the
	// union.
	const highlightAudioEntities = computed<AudioEntityView[]>(() => {
		const detected = entities.value.filter(
			(e): e is AudioEntityView => e.modality === "audio",
		);
		return [...detected, ...addedAudioEntities.value].map((e) => {
			const override = audioSpanOverrides.value.get(e.id);
			return {
				...e,
				span: override ?? e.span,
				suppressed: suppressed.value.has(e.id),
			};
		});
	});

	// All reviewer-added entities (any modality) as views, for the audit list's
	// "added by you" band — so a drawn image box / audio span shows there like an
	// added text span.
	const addedEntities = computed<StudioEntityView[]>(() => [
		...addedTextEntities.value,
		...addedImageEntities.value,
		...addedAudioEntities.value,
	]);

	// Assemble the reviewer edits into the redaction EditSet: a `suppress` edit per
	// kept entity (bucketed by modality) and an `add` edit per reviewer-marked span
	// (text) or drawn box (image). Returns undefined when there are no edits, so the
	// redact call omits `edits` (redact exactly as detected).
	function buildEditSet(): EditSet | undefined {
		if (
			suppressed.value.size === 0 &&
			addedTexts.value.length === 0 &&
			addedImages.value.length === 0 &&
			addedAudios.value.length === 0 &&
			audioSpanOverrides.value.size === 0
		)
			return undefined;
		const text: NonNullable<EditSet["text"]> = [];
		const tabular: NonNullable<EditSet["tabular"]> = [];
		const image: NonNullable<EditSet["image"]> = [];
		const audio: NonNullable<EditSet["audio"]> = [];
		// A kept entity's suppress edit goes to its own modality's bucket.
		for (const entity of entities.value) {
			if (!suppressed.value.has(entity.id)) continue;
			const bucket =
				entity.modality === "tabular"
					? tabular
					: entity.modality === "image"
						? image
						: entity.modality === "audio"
							? audio
							: text;
			bucket.push({ op: "suppress", id: entity.id });
		}
		for (const a of addedTexts.value) {
			// A DOCX add carries a source-only coord (no decoded stream on the client);
			// a flat-text add carries a decoded coord off the shown document's offsets.
			const location: TextLocation = {
				coord: a.source
					? sourceCoord(a.source)
					: decodedCoord(a.byteStart, a.byteEnd),
			};
			text.push({ op: "add", label: a.label, location });
		}
		for (const a of addedImages.value) {
			// A drawn box is an image `add` located by its bounding box in the image's
			// natural pixel coordinates.
			const location: ImageLocation = {
				bounding_box: {
					min: { x: a.box.minX, y: a.box.minY },
					max: { x: a.box.maxX, y: a.box.maxY },
				},
			};
			image.push({ op: "add", label: a.label, location });
		}
		// The API's TimeSpan is microseconds; the reviewer's spans are in seconds.
		const audioLocation = (span: AddAudioSpan): AudioLocation => ({
			span: {
				start_us: Math.round(span.start * 1e6),
				end_us: Math.round(span.end * 1e6),
			},
		});
		for (const a of addedAudios.value) {
			// A selected span is an audio `add` located by its time span.
			audio.push({
				op: "add",
				label: a.label,
				location: audioLocation(a.span),
			});
		}
		for (const [id, span] of audioSpanOverrides.value) {
			// A dragged edge on a *detected* entity is a `retag` correcting its location.
			audio.push({ op: "retag", id, location: audioLocation(span) });
		}
		const set: EditSet = {};
		if (text.length) set.text = text;
		if (tabular.length) set.tabular = tabular;
		if (image.length) set.image = image;
		if (audio.length) set.audio = audio;
		return text.length || tabular.length || image.length || audio.length
			? set
			: undefined;
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
		addTextEntity,
		addImageEntity,
		addAudioEntity,
		retagAudioSpan,
		removeAdded,
		addedEntities,
		highlightTextEntities,
		highlightImageEntities,
		highlightAudioEntities,
		suppressedCount,
		effectiveRedactCount,
	};
}
