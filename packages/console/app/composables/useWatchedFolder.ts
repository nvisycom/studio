/**
 * The desktop watched-folder configuration, behind a host seam. On the web
 * there's no local filesystem to watch, so the providers stay unset; the desktop
 * app fills them (folder picker + Tauri watch commands) from a client plugin.
 * Shared UI reads/sets the config without importing Tauri — like
 * {@link useFileBridge}.
 *
 * Only meaningful where `usePlatform().isDesktop` is true; a shared page gates
 * the card on that and calls these providers, which the desktop has injected.
 */
import type { Ref } from "vue";

/** The current watched folder + the workspace it auto-uploads to. */
export interface WatchedFolder {
	folder: string;
	workspaceSlug: string;
}

/** Read the current config (null when nothing is watched). */
export type GetWatchFn = () => Promise<WatchedFolder | null>;
/** Prompt for a folder and start watching it for `workspaceSlug`; null if the
 *  user cancelled the folder picker. */
export type SetWatchFn = (
	workspaceSlug: string,
) => Promise<WatchedFolder | null>;
/** Stop watching and clear the config. */
export type ClearWatchFn = () => Promise<void>;

interface WatchedFolderBridge {
	get?: GetWatchFn;
	set?: SetWatchFn;
	clear?: ClearWatchFn;
}

// Module-level so an injected provider is shared across consumers.
const bridge = ref<WatchedFolderBridge>({});

/** Inject the watched-folder providers (desktop only). */
export function setWatchedFolder(next: WatchedFolderBridge) {
	bridge.value = next;
}

export function useWatchedFolder(): {
	/** The providers, empty on the web. */
	watchedFolder: Readonly<Ref<WatchedFolderBridge>>;
} {
	return { watchedFolder: bridge };
}
