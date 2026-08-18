/**
 * A custom `fetch` for the SDK to make API requests with, or `undefined` to use
 * the global `fetch`.
 *
 * The web app uses the global fetch (browser). The desktop app injects Tauri's
 * native `fetch` (via `setApiFetch` from a desktop-only plugin), which performs
 * the request in the Rust process and so isn't subject to the webview's CORS —
 * letting the user connect to any server whose origin the API doesn't allowlist.
 *
 * This composable stays free of any Tauri dependency: the layer only exposes the
 * seam, and the desktop fills it in. Consumers (the SDK plugin, `useAuth`) read
 * `apiFetch` and pass it straight to the SDK's `fetch` option.
 */
import type { Ref } from "vue";

type FetchFn = typeof globalThis.fetch;

// Module-level so the injected fetch is shared across every consumer.
const apiFetch = ref<FetchFn | undefined>(undefined);

/** Inject the fetch the SDK should use (desktop: Tauri's native fetch). */
export function setApiFetch(fn: FetchFn | undefined) {
	apiFetch.value = fn;
}

export function useApiFetch(): {
	/** The custom fetch, or undefined to fall back to the global `fetch`. */
	apiFetch: Readonly<Ref<FetchFn | undefined>>;
} {
	return { apiFetch };
}
