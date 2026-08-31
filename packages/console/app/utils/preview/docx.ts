/**
 * DOCX source-span helpers for the entity model.
 *
 * A detection addresses its value by a raw-source byte range (a `SourceRef`)
 * into a DOCX part (usually `word/document.xml`). These helpers describe that
 * model and reconstruct an entity's matched text from the raw part bytes —
 * independent of how the document is *rendered* (SuperDoc renders the preview;
 * see StudioDocxView).
 */

/**
 * A raw-source byte range from a detection (a `SourceRef`), flattened to plain
 * offsets. `part` names the container file the bytes index (for DOCX, usually
 * `word/document.xml`); absent for a single-file source.
 */
export interface DocxSourceRef {
	part?: string;
	start: number;
	end: number;
}

/**
 * DOCX parts that render as visible page text (so their entities are locatable):
 * the main document body, plus headers, footers, and foot/endnotes. Other parts
 * (`.rels`, styles, metadata) are not visible body text. `word/document.xml` is
 * the common case.
 */
export function isRenderedDocxPart(part: string | undefined): boolean {
	if (!part) return true; // no part = single-file source = the document body
	return (
		part === "word/document.xml" ||
		/^word\/(header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(part)
	);
}

/**
 * Reconstruct an entity's matched text from its raw-source byte ranges by
 * slicing the raw bytes of each ref's container part. Works for any part (the
 * main `document.xml`, but also `.rels` hyperlink targets and other metadata),
 * so a detection outside the visible body still shows its value. Ranges are
 * concatenated in order. Returns "" when no part bytes are available.
 *
 * `parts` maps a part name to its raw bytes; a ref with no `part` falls back to
 * `document.xml`. Byte offsets are UTF-8; the slice is decoded to a string.
 */
export function docxMatchedText(
	parts: Map<string, Uint8Array>,
	refs: DocxSourceRef[],
): string {
	const decoder = new TextDecoder();
	let out = "";
	for (const ref of refs) {
		const bytes = parts.get(ref.part ?? "word/document.xml");
		if (!bytes) continue;
		out += decoder.decode(bytes.subarray(ref.start, ref.end));
	}
	return out;
}
