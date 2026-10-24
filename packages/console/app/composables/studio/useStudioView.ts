/**
 * Shared loading contract for the studio document-preview views (DOCX, CSV,
 * text/JSON, image). Each view renders one file kind but reports its progress the
 * same way — a {@link StudioViewPhase} — so the host ({@link
 * StudioDocumentPreview}) shows a single, consistent loader (with phase-aware
 * copy) and error, instead of every view drawing its own.
 *
 * The props/emits *shape* is declared locally in each view (Vue's
 * `defineProps`/`defineEmits` macros can't resolve a type imported through the
 * `#console` alias as their whole generic), so this module holds only the phase
 * types + helper, which are referenced from those local interfaces and used as
 * values by the host.
 */

/**
 * The stage a view is at while bringing its content on screen. Views move
 * `idle -> downloading -> (parsing | rendering) -> ready`, or land on `error`.
 * Not every view uses every stage (a small text file jumps to `ready`; only the
 * DOCX view has a distinct `rendering` stage) — the host just needs to know
 * whether the content is on screen yet and, if not, what to say.
 */
export type StudioViewStatus =
	| "idle" // nothing open
	| "downloading" // fetching the file bytes
	| "parsing" // decoding / formatting the bytes (CSV, JSON, …)
	| "rendering" // laying the content out (DOCX / SuperDoc)
	| "ready" // content is on screen
	| "error"; // failed to load

export interface StudioViewPhase {
	status: StudioViewStatus;
	/** A short reason, for the error case (surfaced to the reviewer). */
	message?: string;
}

/** Whether a phase means the view is still working (host keeps its loader up). */
export function isViewLoading(phase: StudioViewPhase): boolean {
	return (
		phase.status === "downloading" ||
		phase.status === "parsing" ||
		phase.status === "rendering"
	);
}
