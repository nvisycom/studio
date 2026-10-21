import type { Ref } from "vue";

/**
 * The seam between the shared UI and native host capabilities — OS-level actions
 * the browser has no equivalent for (native dialogs, and the like). Distinct from
 * {@link useFileBridge}, which is file-I/O streams (open/save/drop); this is host
 * actions.
 *
 * In the browser every capability stays `undefined`, and a consumer treats its
 * absence as "not available here" (e.g. hides the affordance). The desktop app
 * injects Tauri-backed implementations from a desktop-only plugin via
 * {@link setNativeHost}.
 *
 * Like {@link useApiFetch} / {@link useFileBridge}, this composable stays free of
 * any Tauri dependency: the layer only declares the capability surface, and the
 * desktop fills it in. A console component should gate on the capability's
 * presence (`!!pickFolder`), not on `isDesktop` — the question is whether the
 * host can do it, not which platform this is.
 */

/**
 * Open a native folder picker and resolve the chosen absolute path, or `null`
 * if the user cancelled. Used to pick the folder that backs a local workspace.
 */
export type PickFolderFn = () => Promise<string | null>;

/** Native host capabilities, or `undefined` where the host can't provide them. */
export interface NativeHost {
	pickFolder?: PickFolderFn;
}

// Module-level so an injected host is shared across every consumer.
const host = ref<NativeHost>({});

/** Inject native host capabilities (desktop only). */
export function setNativeHost(next: NativeHost) {
	host.value = next;
}

export function useNativeHost(): {
	/** The active native host capabilities (empty object in the browser). */
	host: Ref<NativeHost>;
} {
	return { host };
}
