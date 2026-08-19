import { computed, type Ref } from "vue";

/**
 * What the spotlight bar thinks the user is entering.
 *
 * The launcher is chat-first: you just type. We infer whether the text reads as
 * a file (a path or a bare filename with an extension) or a plain message for
 * the assistant, and reflect that back so the action is never a surprise. The
 * inference is intentionally conservative — anything that isn't clearly a file
 * is treated as a message, since messaging is the primary use.
 */
export type SpotlightIntent = "empty" | "message" | "file";

// A token that ends in a real file extension, e.g. `report.pdf`, `data.csv`.
// The extension is 1–8 chars so version-like tails (`v1.2`) don't register as
// files while common document/media/code extensions do.
const FILE_EXTENSION = /\.[a-z0-9]{1,8}$/i;
// An absolute or home/relative path segment: `/Users/…`, `~/…`, `C:\…`, `./…`.
const PATH_PREFIX = /^(\/|~\/|\.\.?\/|[a-z]:\\)/i;

/**
 * Whether a single trimmed line looks like a file reference. A path prefix
 * counts on its own; otherwise the text must be a single token (no spaces) that
 * ends in a file extension, so a sentence merely mentioning "report.pdf" stays a
 * message.
 */
function looksLikeFile(text: string): boolean {
	if (PATH_PREFIX.test(text)) return true;
	const isSingleToken = !/\s/.test(text);
	return isSingleToken && FILE_EXTENSION.test(text);
}

/**
 * Derive the live intent from the input text. Returns `empty` for blank input so
 * the UI can show its resting placeholder state.
 */
export function useSpotlightIntent(text: Ref<string>) {
	const intent = computed<SpotlightIntent>(() => {
		const value = text.value.trim();
		if (!value) return "empty";
		return looksLikeFile(value) ? "file" : "message";
	});

	return { intent };
}
