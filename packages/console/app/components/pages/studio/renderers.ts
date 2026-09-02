/**
 * The studio preview renderer registry: one declarative entry per file-format
 * family (image, CSV, text/JSON, DOCX, …). This is the single source of truth for
 * "how is a file of extension X handled" — replacing the `isImage`/`isText`/
 * `isDocx` boolean switchboard that used to be spread across the file utils, the
 * page's data watchers, and the preview dispatcher.
 *
 * Adding a new format is one entry here: its extensions, its lazily-imported view
 * component (so each renderer's heavy deps stay code-split and only load when that
 * format opens), which detection source it needs, and its preview capabilities.
 * The dispatcher ({@link StudioDocumentPreview}) and the page read this registry
 * instead of hardcoding kinds, so nothing else changes when the list grows.
 *
 * NOTE: renderer components are self-contained and SDK-free — they take a
 * `contentUrl` + the shared {@link StudioViewPhase}/entity contract and render.
 * That keeps this whole surface lift-out-ready if the preview engine ever becomes
 * its own package; for now it lives in the shared layer with its one consumer.
 */
import type { Component } from "vue";

/**
 * Which detection source a renderer's file kind feeds the detection pipeline.
 * Detection needs the file's content in a form it can scan; that form differs by
 * kind, and the page fetches it lazily off this field (instead of a per-kind
 * hardcoded watcher):
 *
 * - `text` — flat UTF-8 text (fetched from the blob), the common case (CSV, JSON,
 *   plain text, and most future text-backed formats).
 * - `docx-parts` — the OOXML zip's entries (DOCX has no flat text; matches are
 *   sliced from raw part byte spans, incl. parts outside the visible body).
 * - `transcript` — a server-produced transcript fetched from the detection's
 *   enrichment intermediates (audio: there's no client-side text; the transcript
 *   is the searchable content, with timings for the timeline). Optional — a
 *   detection may have none.
 * - `none` — nothing to scan client-side (images: detection is server/OCR-side,
 *   not from a text blob).
 */
export type DetectionSource = "text" | "docx-parts" | "transcript" | "none";

/** One registered file-format family and how the studio previews it. */
export interface StudioRenderer {
	/** Stable id (also the legacy "kind"): "image" | "csv" | "text" | "docx" … */
	kind: string;
	/**
	 * File extensions this renderer handles (lower-case, no dot). Matched against
	 * the API's real `fileExtension`, not the display name (a redacted
	 * `report.csv.redacted` keeps `fileExtension: "csv"`).
	 */
	extensions: readonly string[];
	/**
	 * Lazy loader for the view component, so a format's renderer (and its heavy
	 * deps — SuperDoc, a future PDF/XLSX engine, …) only loads when a file of that
	 * kind is actually opened. The dispatcher wraps this in an async component whose
	 * load failures surface through the shared error phase (a chunk that fails to
	 * fetch is just an `error`, like any other load failure) — see
	 * {@link StudioDocumentPreview}.
	 */
	component: () => Promise<Component | { default: Component }>;
	/** Which content form detection needs for this kind (drives the page fetch). */
	detectionSource: DetectionSource;
	/**
	 * Optional wrapper class the dispatcher puts around the view — the "paper on
	 * canvas" padding the text/CSV views expect (`flex min-h-full flex-col p-6`).
	 * Views that lay out edge-to-edge (image, DOCX, audio) omit it.
	 */
	wrapperClass?: string;
}

/**
 * The registry, in match order. Extensions are unique across entries (a file maps
 * to at most one renderer); order only matters as a tie-break guard, so keep it
 * unambiguous. Lazy `component` imports mirror the previous static ones.
 */
export const STUDIO_RENDERERS: readonly StudioRenderer[] = [
	{
		kind: "image",
		extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"],
		component: () => import("./StudioImageView.vue"),
		detectionSource: "none",
	},
	{
		kind: "audio",
		// The backend-supported, browser-playable audio formats.
		extensions: ["wav", "mp3", "ogg"],
		component: () => import("./StudioAudioView.vue"),
		// Detection runs server-side; the searchable content is the transcript from
		// the detection's intermediates (fetched once detection completes). Optional:
		// a detection may have no transcript, in which case the player has none.
		detectionSource: "transcript",
		// Fill the preview height so the transcript panel can flex to fill the space
		// below the player.
		wrapperClass: "h-full",
	},
	{
		kind: "csv",
		extensions: ["csv"],
		component: () => import("./StudioCsvView.vue"),
		detectionSource: "text",
		wrapperClass: "flex min-h-full flex-col p-6",
	},
	{
		kind: "text",
		extensions: ["txt", "md", "log", "json", "xml", "yaml", "yml"],
		component: () => import("./StudioTextView.vue"),
		detectionSource: "text",
		wrapperClass: "flex min-h-full flex-col p-6",
	},
	{
		kind: "docx",
		extensions: ["docx"],
		component: () => import("./StudioDocxView.vue"),
		detectionSource: "docx-parts",
	},
];

/** Extension -> renderer index, built once (extensions are unique per renderer). */
const BY_EXTENSION = new Map<string, StudioRenderer>(
	STUDIO_RENDERERS.flatMap((renderer) =>
		renderer.extensions.map((ext) => [ext, renderer] as const),
	),
);

/**
 * The renderer for a file extension (the API's real `fileExtension`), or
 * `undefined` if no registered renderer previews it (the "unsupported file type"
 * case). Case-insensitive.
 */
export function rendererFor(extension: string): StudioRenderer | undefined {
	return BY_EXTENSION.get(extension.toLowerCase());
}
