import { useLocalStorage } from "@vueuse/core";

/** localStorage key for the studio's entity-highlight visibility preference. */
export const STUDIO_HIGHLIGHT_BOLD_KEY = "studio-highlight-bold";

// Shared across the studio so the audit toolbar's toggle and the document
// preview that reads it stay in lockstep. Persisted so the reviewer's choice
// survives file switches and sessions.
const bold = useLocalStorage(STUDIO_HIGHLIGHT_BOLD_KEY, false);

/**
 * Entity-highlight visibility for the studio preview. In the default (subtle)
 * mode highlights are a marker underline; `bold` turns on a highlighter-pen fill
 * behind every entity so detections pop. The preview root reflects this as
 * `data-highlight="bold"`, which `assets/css/entities.css` styles.
 */
export function useStudioHighlight() {
	return { bold };
}
