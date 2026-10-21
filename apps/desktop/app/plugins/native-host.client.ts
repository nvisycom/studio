import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * Fill the shared native-host seam with Tauri-backed capabilities.
 *
 * The shared UI reaches OS-level actions through `useNativeHost`; on the web the
 * seam stays unset and a consumer hides the affordance. Here each capability is a
 * Rust command invoked from this one place — so the console never imports Tauri
 * or names a command. On a plain browser `isTauri()` is false and the seam is
 * left untouched.
 */
export default defineNuxtPlugin({
	name: "native-host",
	enforce: "pre",
	setup() {
		if (!isTauri()) return;

		setNativeHost({
			// Native folder picker for a local workspace's backing folder.
			pickFolder: () => invoke<string | null>("pick_workspace_folder"),
		});
	},
});
