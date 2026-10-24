import JSZip from "jszip";
import type { MaybeRefOrGetter } from "vue";

/**
 * Derives the active document's content from its already-loaded preview blob, in
 * the shapes the audit panel needs to slice each detection's matched value:
 *
 * - `documentText` — the flat text, for text-backed files (the detection source
 *   is `"text"`). Other files leave it null.
 * - `docxParts` — every DOCX zip entry's bytes (source is `"docx-parts"`), so a
 *   matched value can be sliced from raw-source byte spans, including parts
 *   outside the visible body (e.g. hyperlink targets in `word/_rels/...`). DOCX
 *   has no flat text, so `documentText` stays null for it.
 * - `bytes()` — the raw document bytes, which the on-device engine needs offline
 *   (the server path, holding the stored document, ignores them).
 *
 * Each async read guards against a stale response: the file can change while a
 * fetch is in flight, so a result applies only while its URL is still active.
 */
export function useStudioContent(
	contentUrl: MaybeRefOrGetter<string | null | undefined>,
	detectionSource: MaybeRefOrGetter<string>,
) {
	const documentText = ref<string | null>(null);
	watch(
		[() => toValue(contentUrl), () => toValue(detectionSource) === "text"],
		async ([url, isText]) => {
			documentText.value = null;
			if (!url || !isText) return;
			try {
				const text = await (await fetch(url)).text();
				if (toValue(contentUrl) === url) documentText.value = text;
			} catch {
				if (toValue(contentUrl) === url) documentText.value = null;
			}
		},
		{ immediate: true },
	);

	const docxParts = ref<Map<string, Uint8Array> | null>(null);
	watch(
		[
			() => toValue(contentUrl),
			() => toValue(detectionSource) === "docx-parts",
		],
		async ([url, isDocx]) => {
			docxParts.value = null;
			if (!url || !isDocx) return;
			try {
				const buffer = await (await fetch(url)).arrayBuffer();
				const zip = await JSZip.loadAsync(buffer);
				const parts = new Map<string, Uint8Array>();
				await Promise.all(
					Object.values(zip.files)
						.filter((f) => !f.dir)
						.map(async (f) => parts.set(f.name, await f.async("uint8array"))),
				);
				if (toValue(contentUrl) === url) docxParts.value = parts;
			} catch {
				if (toValue(contentUrl) === url) docxParts.value = null;
			}
		},
		{ immediate: true },
	);

	async function bytes(): Promise<Uint8Array> {
		const url = toValue(contentUrl);
		if (!url) throw new Error("The document is not loaded yet.");
		return new Uint8Array(await (await fetch(url)).arrayBuffer());
	}

	return { documentText, docxParts, bytes };
}
