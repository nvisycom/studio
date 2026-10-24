import type { MaybeRefOrGetter, Ref } from "vue";

/**
 * Fetch the text body of a blob object URL, re-fetching whenever the URL
 * changes. Shared by the studio preview components (CSV, plain text, JSON, …),
 * which all read their file the same way before running the highlight pipeline.
 *
 * A stale-response guard drops a fetch whose URL changed while it was in flight,
 * so a fast file switch can't clobber the current text. When the URL is null
 * (nothing open) the state resets to idle — `isLoading` included — so a spinner
 * never lingers on a component that stays mounted after its file closes.
 */
export function useBlobText(source: MaybeRefOrGetter<string | null>): {
	text: Ref<string | null>;
	isLoading: Ref<boolean>;
	error: Ref<boolean>;
} {
	const text = ref<string | null>(null);
	const isLoading = ref(false);
	const error = ref(false);

	watch(
		() => toValue(source),
		async (url) => {
			text.value = null;
			error.value = false;
			if (!url) {
				isLoading.value = false;
				return;
			}
			isLoading.value = true;
			try {
				const response = await fetch(url);
				const body = await response.text();
				// Ignore a stale response if the URL changed mid-fetch.
				if (toValue(source) === url) text.value = body;
			} catch {
				if (toValue(source) === url) error.value = true;
			} finally {
				if (toValue(source) === url) isLoading.value = false;
			}
		},
		{ immediate: true },
	);

	return { text, isLoading, error };
}
