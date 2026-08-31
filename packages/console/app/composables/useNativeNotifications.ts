/**
 * The device-scoped native-notification preference, behind a host seam. On the
 * web there's no such thing, so the providers stay unset; the desktop app fills
 * them (reading/writing the Tauri store) from a client plugin. Shared UI reads
 * the state and toggles it without importing Tauri — like {@link useFileBridge}.
 *
 * Only meaningful where `usePlatform().isDesktop` is true; a shared page gates
 * the card on that and calls these providers, which the desktop has injected.
 */
import type { Ref } from "vue";

/** Read the current enabled state (desktop store). */
export type GetEnabledFn = () => Promise<boolean>;
/** Persist the enabled state (desktop store + tray sync). */
export type SetEnabledFn = (enabled: boolean) => Promise<void>;

interface NativeNotifications {
	getEnabled?: GetEnabledFn;
	setEnabled?: SetEnabledFn;
}

// Module-level so an injected provider is shared across consumers.
const bridge = ref<NativeNotifications>({});

/** Inject the native-notification providers (desktop only). */
export function setNativeNotifications(next: NativeNotifications) {
	bridge.value = next;
}

export function useNativeNotifications(): {
	/** The providers, empty on the web. */
	notifications: Readonly<Ref<NativeNotifications>>;
} {
	return { notifications: bridge };
}
