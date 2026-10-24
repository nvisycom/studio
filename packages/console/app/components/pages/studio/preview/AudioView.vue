<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import {
	FileText,
	MicOff,
	Minimize2,
	Pause,
	Play,
	Plus,
	RotateCcw,
	RotateCw,
	Volume1,
	Volume2,
	VolumeX,
	X,
} from "@lucide/vue";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#console/components/ui/empty";
// Type-only imports: give the instances real types without pulling wavesurfer into
// the bundle — the runtime load stays the dynamic `import()` in `build()`.
import type WaveSurfer from "wavesurfer.js";
import type RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";
import type { Region } from "wavesurfer.js/dist/plugins/regions.js";
import type { Transcription } from "@nvisy/sdk/datatypes";
import AddEntityPopover from "../entities/AddEntityPopover.vue";
import type { AddAudioEntityInput } from "#console/composables/useStudioRedaction";
import type { AudioEntityView } from "#console/composables/useAudioEntities";
import type { StudioViewPhase } from "#console/composables/useStudioView";

/**
 * The transcript panel's state, resolved by the page once a detection settles:
 * - `hidden` — no completed detection yet; the panel isn't shown.
 * - `unavailable` — the detection produced no intermediates (never generated, or
 *   removed): the endpoint 404'd.
 * - `empty` — a transcript exists but has no speech segments (no speech detected).
 * - `ready` — the transcript, with segments.
 */
export type AudioTranscriptState =
	| { kind: "hidden" }
	| { kind: "unavailable" }
	| { kind: "empty" }
	| { kind: "ready"; transcript: Transcription };

/**
 * Audio preview: a waveform player for accepted audio files (WAV / MP3 / OGG).
 * One of the studio views (see the shared contract in `useStudioView`); it reports
 * its loading `phase` to the host so the single host loader covers decoding, and
 * an `error` phase if the file can't be decoded.
 *
 * Rendered with wavesurfer.js — the browser decodes the audio, wavesurfer draws
 * the waveform and owns transport (play/seek). It's dynamically imported the first
 * time an audio file opens so its code stays out of the initial bundle.
 *
 * Detected + added entities are painted as regions on the waveform (via the
 * regions plugin), colored by category, click-to-focus; a drag-selected span can
 * be added as a custom entity. The transcript panel (segment click-to-seek) shows
 * once a detection produces one.
 */
// Local interfaces (see the note in StudioDocxView on why the view contract is
// declared locally rather than via the shared aliased type).
interface Props {
	/** Blob object URL of the audio file, or null when nothing is open. */
	contentUrl: string | null;
	/** File name (for the accessible label). */
	displayName?: string;
	/**
	 * The detection's transcript state, once a detection has completed. Only shown
	 * then; before that it's `hidden`. `unavailable` = the detection produced no
	 * intermediates (never generated or removed — the endpoint 404s); `empty` = a
	 * transcript exists but has no speech segments; `ready` carries the transcript.
	 */
	transcriptState?: AudioTranscriptState;
	/** Detected + added audio entities to overlay as regions on the waveform. */
	entities?: AudioEntityView[];
	/** Currently focused entity id, for the active region + seek. */
	activeEntityId?: string | null;
	/** Whether the reviewer may add entities by selecting a span (detection complete). */
	canAdd?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
	transcriptState: () => ({ kind: "hidden" }),
	entities: () => [],
	activeEntityId: null,
	canAdd: false,
});

const emit = defineEmits<{
	/** Loading phase, so the host shows the single loader/error. */
	phase: [phase: StudioViewPhase];
	/** A region was clicked — focus that entity (cross-highlight with the audit list). */
	"focus-entity": [id: string];
	/** A reviewer marked the selected span as a new audio entity to redact. */
	"add-audio-entity": [payload: AddAudioEntityInput];
	/** A reviewer dragged an entity region's edge — correct its span (seconds). */
	"retag-audio-span": [id: string, span: { start: number; end: number }];
}>();

const { t } = useI18n();

const waveform = ref<HTMLElement | null>(null);

// The live wavesurfer instance + its regions plugin, plus the current selection
// region (typed via the type-only imports; created lazily in `build`). Reactive
// transport state below is what the controls bind to.
let ws: WaveSurfer | null = null;
let regions: RegionsPlugin | null = null;
let selection: Region | null = null;

const isPlaying = ref(false);
const isMuted = ref(false);
const currentTime = ref(0);
const duration = ref(0);
// The current selection region's on-screen rect, for anchoring the floating
// selection toolbar (its presence = "a span is selected"). Refreshed on select /
// resize / zoom / scroll. Scoped playback keys off the `selection` region itself.
const selectionRect = ref<DOMRect | null>(null);

/** Recompute the selection region's on-screen rect (for the floating toolbar). */
function refreshSelectionRect() {
	selectionRect.value = selection?.element?.getBoundingClientRect() ?? null;
}

// The label popover for turning the current selection into a custom entity: the
// span + anchor rect frozen when it opens, plus the chosen label. Frozen so a
// later re-selection can't change what gets added. Only offered when a selection
// exists and adding is enabled (`canAdd`).
const addSpan = ref<{ start: number; end: number } | null>(null);
const addRect = ref<DOMRect | null>(null);
const addLabel = ref("");
// The span's time range, shown in the popover so the reviewer sees exactly which
// stretch they're about to redact.
const addLocation = computed(() =>
	addSpan.value
		? t("studio.audit.timeSpan", {
				start: formatTimecode(addSpan.value.start),
				end: formatTimecode(addSpan.value.end),
			})
		: "",
);

// How far to skip on the back/forward controls, in seconds (the podcast idiom).
const SKIP_SECONDS = 10;

// Playback speed, cycled through these rates by the speed control.
const SPEEDS = [1, 1.25, 1.5, 2, 0.5] as const;

// Volume and speed are per-viewer preferences: persisted to localStorage so they
// carry across files and sessions (like the codebase's other localStorage prefs).
// Reads/writes are guarded — a private window or blocked storage throws.
const VOLUME_KEY = "studio.audio.volume";
const SPEED_KEY = "studio.audio.speed";

function readStored(key: string, fallback: number, min: number, max: number) {
	if (!import.meta.client) return fallback;
	try {
		const raw = localStorage.getItem(key);
		if (raw === null) return fallback;
		const value = Number(raw);
		return Number.isFinite(value) && value >= min && value <= max
			? value
			: fallback;
	} catch {
		return fallback;
	}
}

function writeStored(key: string, value: number) {
	if (!import.meta.client) return;
	try {
		localStorage.setItem(key, String(value));
	} catch {
		// Storage unavailable (private window, quota) — the preference just won't
		// persist; the live value still applies for this session.
	}
}

const volume = ref(readStored(VOLUME_KEY, 1, 0, 1));
// Only accept a stored speed that's one of our offered rates.
const storedSpeed = readStored(SPEED_KEY, 1, 0.5, 2);
const speed = ref<number>(
	(SPEEDS as readonly number[]).includes(storedSpeed) ? storedSpeed : 1,
);

// Persist on change (the live values are applied to wavesurfer at their call sites
// and on `ready`).
watch(volume, (v) => writeStored(VOLUME_KEY, v));
watch(speed, (s) => writeStored(SPEED_KEY, s));

// Whether the transcript panel shows at all (any state past a completed
// detection). `hidden` keeps it out entirely.
const showTranscriptPanel = computed(
	() => props.transcriptState.kind !== "hidden",
);

// Transcript segments, each with its start time (seconds) precomputed for
// click-to-seek + display. Only the `ready` state has any; timings are
// microseconds from the stream start.
const segments = computed(() => {
	const state = props.transcriptState;
	if (state.kind !== "ready") return [];
	return state.transcript.segments
		.filter((s) => s.text.trim().length > 0)
		.map((s, index) => ({
			index,
			text: s.text,
			start: s.span.start_us / 1e6,
		}));
});

/** Seek playback to a time (seconds) and reflect it immediately. */
function seekTo(seconds: number) {
	if (!ws || !duration.value) return;
	ws.setTime(Math.max(0, Math.min(duration.value, seconds)));
}

/** Resolve a theme token to a concrete color string (wavesurfer needs a real
 * color, not a CSS `var()`), read live so it matches the current theme. */
function themeColor(token: string, fallback: string): string {
	if (!waveform.value) return fallback;
	const value = getComputedStyle(waveform.value).getPropertyValue(token).trim();
	return value || fallback;
}

// Entity regions are added programmatically (not by drag), so they carry this id
// prefix — used to tell them apart from the drag-selection region in the
// `region-created` handler, and to map a clicked region back to its entity.
const ENTITY_REGION_PREFIX = "entity:";

/** A translucent category color for an entity region (theme-aware, from the
 * `--flag-<category>` tokens in entities.css). */
function categoryFill(category: string | null): string {
	const token = category ? `--flag-${category}` : "--flag";
	const color = themeColor(token, "oklch(0.55 0.03 260)");
	return `color-mix(in oklch, ${color} 26%, transparent)`;
}

/** Redraw the detected/added entity regions from `props.entities`. Removes the
 * previous entity regions (leaving the drag-selection region alone) and adds one
 * per entity, colored by category and passive (click focuses, no drag/resize). */
function renderEntityRegions() {
	if (!regions) return;
	for (const r of regions.getRegions()) {
		if (r.id.startsWith(ENTITY_REGION_PREFIX)) r.remove();
	}
	for (const e of props.entities) {
		const region = regions.addRegion({
			id: `${ENTITY_REGION_PREFIX}${e.id}`,
			start: e.span.start,
			end: e.span.end,
			color: categoryFill(e.category),
			// Not movable, but resizable — drag an edge to correct the span (retag).
			drag: false,
			resize: true,
		});
		// Dim a suppressed (kept) entity so it reads as "won't be redacted".
		if (e.suppressed && region.element) region.element.style.opacity = "0.4";
	}
}

async function build(url: string, target: HTMLElement) {
	teardown();
	emit("phase", { status: "downloading" });
	try {
		// Dynamic import: keep wavesurfer (and its regions plugin) out of the initial
		// bundle — they load on the first audio open, like the DOCX view's SuperDoc.
		const [{ default: WaveSurfer }, { default: RegionsPlugin }] =
			await Promise.all([
				import("wavesurfer.js"),
				import("wavesurfer.js/dist/plugins/regions.js"),
			]);
		// A newer file may have opened while the modules loaded — bail if so.
		if (props.contentUrl !== url || waveform.value !== target) return;

		regions = RegionsPlugin.create();
		ws = WaveSurfer.create({
			container: target,
			url,
			height: 96,
			barWidth: 2,
			barGap: 1,
			barRadius: 2,
			cursorWidth: 1,
			waveColor: themeColor("--color-muted-foreground", "#71717a"),
			progressColor: themeColor("--color-primary", "#2563eb"),
			cursorColor: themeColor("--color-foreground", "#18181b"),
			// Don't let playback scroll the view: when zoomed into a span, the window
			// stays where the user put it instead of chasing the playhead.
			autoScroll: false,
			autoCenter: false,
			// Hide wavesurfer's own horizontal scrollbar — it overlaps the waveform,
			// and the zoom is navigated by drag-reselect + Reset, not by scrolling.
			hideScrollbar: true,
			plugins: [regions],
		});

		// Drag across the waveform to marquee-select a time span. The selection
		// persists (translucent highlight), the view zooms to fit it, and playback is
		// scoped to it (see `togglePlay` / `resetZoom`). Only one selection at a time:
		// a new drag replaces the previous.
		// Drag empty waveform → create a selection (zoom is decoupled, on the wheel).
		// The selection is resizable (drag its edges to refine) but not movable.
		regions.enableDragSelection({ color: "rgba(37, 99, 235, 0.18)" });
		regions.on("region-created", (region) => {
			// Entity regions are added programmatically (not a drag-select) — leave them.
			if (region.id.startsWith(ENTITY_REGION_PREFIX)) return;
			// A click / tiny drag isn't a selection — drop it and leave the view as is.
			if (region.end - region.start < 0.02) {
				region.remove();
				return;
			}
			if (selection && selection !== region) selection.remove();
			selection = region;
			// A fresh selection supersedes any open add popover (its anchor + frozen
			// span pointed at the previous selection).
			cancelAdd();
			region.setOptions({ drag: false, resize: true });
			refreshSelectionRect();
		});

		regions.on("region-clicked", (region, event) => {
			// Click an entity region → focus that entity (cross-highlight the audit
			// list). Only entity regions map to an id.
			if (region.id.startsWith(ENTITY_REGION_PREFIX)) {
				event.stopPropagation();
				emit("focus-entity", region.id.slice(ENTITY_REGION_PREFIX.length));
			}
		});

		// Resizing a region: for the selection, keep its toolbar anchored; for an
		// entity region, commit the new span as a span override (a `retag`).
		regions.on("region-updated", (region) => {
			if (region === selection) {
				refreshSelectionRect();
				cancelAdd();
			} else if (region.id.startsWith(ENTITY_REGION_PREFIX)) {
				emit("retag-audio-span", region.id.slice(ENTITY_REGION_PREFIX.length), {
					start: region.start,
					end: region.end,
				});
			}
		});

		ws.on("ready", (dur) => {
			duration.value = dur;
			// Apply the persisted volume/speed to this fresh instance.
			ws?.setVolume(volume.value);
			ws?.setPlaybackRate(speed.value);
			// Paint the detected/added entity regions now that the waveform exists.
			renderEntityRegions();
			emit("phase", { status: "ready" });
		});
		ws.on("timeupdate", (time) => {
			currentTime.value = time;
		});
		// Keep the selection toolbar pinned to its region while the view scrolls
		// (e.g. dragging the scrollbar of a zoomed waveform).
		ws.on("scroll", () => {
			if (selection) refreshSelectionRect();
		});
		ws.on("play", () => {
			isPlaying.value = true;
		});
		ws.on("pause", () => {
			isPlaying.value = false;
		});
		ws.on("finish", () => {
			isPlaying.value = false;
		});
		ws.on("error", () => {
			emit("phase", {
				status: "error",
				message: t("studio.preview.audioFailed"),
			});
		});
	} catch {
		if (props.contentUrl === url) {
			teardown();
			emit("phase", {
				status: "error",
				message: t("studio.preview.audioFailed"),
			});
		}
	}
}

function teardown() {
	try {
		ws?.destroy();
	} catch {
		// best-effort — a half-initialized instance may throw on destroy.
	}
	ws = null;
	regions = null;
	selection = null;
	isPlaying.value = false;
	currentTime.value = 0;
	duration.value = 0;
	selectionRect.value = null;
	cancelAdd();
	// Note: volume and speed are persisted preferences — deliberately not reset
	// here, so they carry to the next file.
}

function togglePlay() {
	if (!ws) return;
	if (ws.isPlaying()) {
		ws.pause();
		return;
	}
	// With a span selected, play only that span (stops at its end); otherwise play
	// the whole clip.
	if (selection) selection.play(true);
	else ws.play();
}

/** Skip forward/back by SKIP_SECONDS, clamped to the clip (or the selection when
 * one is active, so skipping stays within the scoped span). */
function skip(deltaSeconds: number) {
	if (!ws) return;
	const lo = selection?.start ?? 0;
	const hi = selection?.end ?? duration.value;
	const next = Math.min(hi, Math.max(lo, ws.getCurrentTime() + deltaSeconds));
	ws.setTime(next);
}

/** Cycle to the next playback rate in SPEEDS. */
function cycleSpeed() {
	const i = SPEEDS.indexOf(speed.value as (typeof SPEEDS)[number]);
	// `?? 1` satisfies noUncheckedIndexedAccess; the modulo always lands in-bounds.
	const next = SPEEDS[(i + 1) % SPEEDS.length] ?? 1;
	speed.value = next;
	ws?.setPlaybackRate(next);
}

function toggleMute() {
	isMuted.value = !isMuted.value;
	ws?.setMuted(isMuted.value);
}

function onVolumeInput(event: Event) {
	const next = Number((event.target as HTMLInputElement).value);
	volume.value = next;
	// Adjusting the slider off zero implicitly unmutes.
	if (next > 0 && isMuted.value) {
		isMuted.value = false;
		ws?.setMuted(false);
	}
	ws?.setVolume(next);
}

// Current horizontal zoom in px/sec; 0 means "fit the clip to the container"
// (wavesurfer's default). Zoom is driven by the wheel (decoupled from selection),
// so selecting a span never yanks the view.
let pxPerSec = 0;
const ZOOM_STEP = 1.2; // multiplicative per wheel notch
const ZOOM_MAX_PX = 2000;

/** Zoom the waveform in/out on a wheel gesture, keeping the time under the cursor
 * stationary so zooming feels anchored to where you point. */
function onWheel(event: WheelEvent) {
	if (!ws || !duration.value) return;
	event.preventDefault();
	const el = waveform.value;
	if (!el) return;
	const width = el.clientWidth || 1;
	// px/sec that exactly fits the clip — the floor (can't zoom out past it).
	const fitPxPerSec = width / duration.value;
	const current = pxPerSec || fitPxPerSec;
	// The clip time currently under the cursor (before the zoom changes scale).
	const rect = el.getBoundingClientRect();
	const cursorTime =
		ws.getScroll() / current + (event.clientX - rect.left) / current;

	const next = event.deltaY < 0 ? current * ZOOM_STEP : current / ZOOM_STEP;
	const clamped = Math.min(ZOOM_MAX_PX, Math.max(fitPxPerSec, next));
	// At the fit level, use 0 so wavesurfer stays responsive to container resizes.
	pxPerSec = clamped <= fitPxPerSec + 0.01 ? 0 : clamped;
	ws.zoom(pxPerSec);

	// Re-scroll so the same clip time sits back under the cursor at the new scale.
	const scale = pxPerSec || fitPxPerSec;
	ws.setScrollTime(
		Math.max(0, cursorTime - (event.clientX - rect.left) / scale),
	);
	refreshSelectionRect();
}

/** Clear the current selection (its region + toolbar + any open add popover). */
function clearSelection() {
	selection?.remove();
	selection = null;
	selectionRect.value = null;
	cancelAdd();
}

/** Reset zoom to fit the whole clip. */
function resetZoom() {
	pxPerSec = 0;
	ws?.zoom(0);
	ws?.setScrollTime(0);
	refreshSelectionRect();
}

/** Open the label popover to add the current selection as a custom entity. Freezes
 * the span + anchor rect so a later re-selection can't change what gets added. */
function startAdd() {
	if (!selection || !props.canAdd) return;
	addSpan.value = { start: selection.start, end: selection.end };
	addRect.value = selection.element?.getBoundingClientRect() ?? null;
	addLabel.value = "";
}

/** Confirm the add: emit the frozen span (seconds) + label. */
function confirmAdd() {
	if (!addSpan.value || !addLabel.value) return;
	emit("add-audio-entity", { label: addLabel.value, span: addSpan.value });
	cancelAdd();
}

function cancelAdd() {
	addSpan.value = null;
	addRect.value = null;
	addLabel.value = "";
}

// (Re)build when the file changes; tear down when it clears or on unmount.
watch(
	[() => props.contentUrl, waveform],
	([url, target]) => {
		if (url && target) void build(url, target);
		else teardown();
	},
	{ immediate: true },
);

// Re-paint entity regions when the entity set changes (detection completes, a
// keep/add edit) — but only once the instance is ready (regions exist).
watch(
	() => props.entities,
	() => {
		if (ws) renderEntityRegions();
	},
	{ deep: true },
);

// Focusing an entity (from the audit list) seeks the waveform to its span start,
// so the reviewer lands on it. The region is already painted; the seek makes it
// visible even when zoomed elsewhere.
watch(
	() => props.activeEntityId,
	(id) => {
		if (!id) return;
		const entity = props.entities.find((e) => e.id === id);
		if (entity) seekTo(entity.span.start);
	},
);

// The selection toolbar is `position: fixed`, positioned from the region's
// viewport rect — keep it pinned when an ancestor scrolls (capture phase, so the
// host's scroll container fires it) or the window resizes.
useEventListener(
	window,
	"scroll",
	() => {
		if (selection) refreshSelectionRect();
	},
	{ capture: true, passive: true },
);
useEventListener(window, "resize", () => {
	if (selection) refreshSelectionRect();
});

onBeforeUnmount(teardown);
</script>

<template>
  <div class="flex h-full min-h-full flex-col items-center gap-6 p-6">
    <div
      class="w-full max-w-5xl flex-shrink-0 rounded-lg border border-border bg-card p-6 shadow-sm"
    >
      <!-- Hint + zoom reset. Drag selects a span; scroll zooms (decoupled). -->
      <div class="mb-2 flex h-6 items-center justify-between">
        <span class="text-xs text-muted-foreground">
          {{ t("studio.preview.audioHint") }}
        </span>
        <button
          type="button"
          class="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          :title="t('studio.preview.audioZoomReset')"
          @click="resetZoom"
        >
          <Minimize2 :size="13" />
          {{ t("studio.preview.audioZoomReset") }}
        </button>
      </div>

      <!-- Waveform canvas (wavesurfer renders into it). Scroll to zoom; drag to
           select. wavesurfer owns its own horizontal scroll when zoomed (don't
           wrap it in another overflow, or a second scrollbar overlaps it). -->
      <div class="relative w-full">
        <div
          ref="waveform"
          class="w-full"
          :aria-label="displayName"
          @wheel="onWheel"
        />
      </div>

      <!-- Transport. Left: skip back / play / skip forward, time, speed. Right:
           volume (icon reveals the slider on hover). -->
      <div class="mt-4 flex items-center gap-3">
        <!-- Skip back 10s -->
        <button
          type="button"
          class="relative flex size-8 flex-shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          :disabled="!duration"
          :aria-label="t('studio.preview.skipBack', { seconds: SKIP_SECONDS })"
          @click="skip(-SKIP_SECONDS)"
        >
          <RotateCcw :size="18" />
          <span class="absolute text-[8px] font-semibold">{{ SKIP_SECONDS }}</span>
        </button>

        <!-- Play / pause (primary) -->
        <button
          type="button"
          class="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          :disabled="!duration"
          :aria-label="isPlaying ? t('studio.preview.pause') : t('studio.preview.play')"
          @click="togglePlay"
        >
          <Pause v-if="isPlaying" :size="18" />
          <Play v-else :size="18" class="ml-0.5" />
        </button>

        <!-- Skip forward 10s -->
        <button
          type="button"
          class="relative flex size-8 flex-shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          :disabled="!duration"
          :aria-label="t('studio.preview.skipForward', { seconds: SKIP_SECONDS })"
          @click="skip(SKIP_SECONDS)"
        >
          <RotateCw :size="18" />
          <span class="absolute text-[8px] font-semibold">{{ SKIP_SECONDS }}</span>
        </button>

        <span
          class="ml-1 font-mono text-xs tabular-nums text-muted-foreground"
          aria-live="off"
        >
          {{ formatTimecode(currentTime) }} / {{ formatTimecode(duration) }}
        </span>

        <!-- Playback speed (tap to cycle) -->
        <button
          type="button"
          class="rounded px-1.5 py-0.5 font-mono text-xs tabular-nums text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          :disabled="!duration"
          :aria-label="t('studio.preview.speed')"
          @click="cycleSpeed"
        >
          {{ speed }}×
        </button>

        <!-- Volume: icon; slider slides in on hover/focus of the group. -->
        <div class="group ml-auto flex items-center gap-1.5">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="isMuted ? 0 : volume"
            class="h-1 w-0 cursor-pointer opacity-0 accent-primary transition-all duration-150 group-hover:w-24 group-hover:opacity-100 group-focus-within:w-24 group-focus-within:opacity-100"
            :aria-label="t('studio.preview.volume')"
            @input="onVolumeInput"
          />
          <button
            type="button"
            class="flex size-8 flex-shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
            :aria-label="isMuted ? t('studio.preview.unmute') : t('studio.preview.mute')"
            @click="toggleMute"
          >
            <VolumeX v-if="isMuted || volume === 0" :size="18" />
            <Volume1 v-else-if="volume < 0.5" :size="18" />
            <Volume2 v-else :size="18" />
          </button>
        </div>
      </div>
    </div>

    <!-- Transcript: shown once a detection has completed, filling the remaining
         height. Three states: the segment list (click-to-seek by start time), or a
         centered empty state when it's unavailable (no intermediates) or empty (no
         speech). Word-level highlighting + entity spans build on this later. -->
    <div
      v-if="showTranscriptPanel"
      class="flex w-full max-w-5xl min-h-0 flex-1 flex-col rounded-lg border border-border bg-card shadow-sm"
    >
      <p
        class="flex-shrink-0 border-b border-border px-6 py-3 text-xs font-medium text-muted-foreground"
      >
        {{ t("studio.preview.transcript") }}
      </p>

      <ul
        v-if="transcriptState.kind === 'ready'"
        class="min-h-0 flex-1 divide-y divide-border overflow-y-auto"
      >
        <li v-for="segment in segments" :key="segment.index">
          <button
            type="button"
            class="flex w-full items-baseline gap-3 px-6 py-2 text-left transition-colors hover:bg-muted/50"
            @click="seekTo(segment.start)"
          >
            <span
              class="flex-shrink-0 font-mono text-xs tabular-nums text-muted-foreground"
            >
              {{ formatTimecode(segment.start) }}
            </span>
            <span class="text-sm text-foreground">{{ segment.text }}</span>
          </button>
        </li>
      </ul>

      <!-- Empty states, centered: unavailable (404) vs. present-but-no-speech. -->
      <div v-else class="flex min-h-0 flex-1 items-center justify-center p-6">
        <Empty>
          <EmptyHeader>
            <MicOff
              v-if="transcriptState.kind === 'empty'"
              :size="32"
              class="mx-auto mb-3 text-muted-foreground"
            />
            <FileText v-else :size="32" class="mx-auto mb-3 text-muted-foreground" />
            <EmptyTitle>
              {{
                transcriptState.kind === "empty"
                  ? t("studio.preview.transcriptEmptyTitle")
                  : t("studio.preview.transcriptUnavailableTitle")
              }}
            </EmptyTitle>
            <EmptyDescription>
              {{
                transcriptState.kind === "empty"
                  ? t("studio.preview.transcriptEmptyDescription")
                  : t("studio.preview.transcriptUnavailableDescription")
              }}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </div>

    <!-- Floating selection toolbar: pinned above the selection region, so the
         actions are prominent and land where the reviewer is looking. Hidden while
         the add popover is open (it takes over). -->
    <Teleport to="body">
      <div
        v-if="selectionRect && !addRect"
        class="fixed z-40 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-md border border-border bg-card px-1 py-0.5 shadow-lg"
        :style="{
          left: `${selectionRect.left + selectionRect.width / 2}px`,
          top: `${selectionRect.top - 6}px`,
        }"
      >
        <button
          v-if="canAdd"
          type="button"
          class="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          @click="startAdd"
        >
          <Plus :size="14" />
          {{ t("studio.preview.audioAddEntity") }}
        </button>
        <button
          type="button"
          class="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          :title="t('studio.preview.audioClearSelection')"
          @click="clearSelection"
        >
          <X :size="14" />
        </button>
      </div>
    </Teleport>

    <!-- Label picker for adding the selected span as a custom entity, anchored to
         the selection region on the waveform. -->
    <AddEntityPopover
      v-model:label="addLabel"
      :rect="addRect"
      :location="addLocation"
      @confirm="confirmAdd"
      @cancel="cancelAdd"
    />
  </div>
</template>
