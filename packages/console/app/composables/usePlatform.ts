/**
 * Which shell the app runs in. The web app leaves this at its default; the
 * desktop app marks it via `setDesktopPlatform` from a client plugin, so shared
 * *pages/features* can render platform-specific UI (e.g. a native-notifications
 * card that only makes sense on desktop).
 *
 * Use this at the app/page level, not in low-level design-system primitives or
 * shared navigation infrastructure — keep those platform-agnostic. Like
 * {@link useApiFetch}, the layer only exposes the flag and never depends on Tauri.
 */
import type { Ref } from "vue";

// Module-level so every consumer sees the same platform.
const isDesktop = ref(false);

/** Mark the app as running inside the desktop (Tauri) shell. */
export function setDesktopPlatform() {
	isDesktop.value = true;
}

export function usePlatform(): {
	/** Whether the app is running in the desktop shell. */
	isDesktop: Readonly<Ref<boolean>>;
} {
	return { isDesktop };
}
