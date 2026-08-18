import type { Ref } from "vue";

/**
 * The API base URL the SDK client talks to.
 *
 * The web build points at a fixed API (`runtimeConfig.public.nvisyApiUrl`), but
 * the desktop app lets the user connect to their own server, so the URL can be
 * overridden at runtime and persisted. This composable resolves the *effective*
 * URL — the persisted override when set, otherwise the build-time default — and
 * the SDK plugin reads it reactively so the client rebuilds when it changes.
 *
 * Persistence is `localStorage` (like `useAuth`), so it works in both the Tauri
 * webview and a plain browser with no Tauri dependency. Apps that never set an
 * override (the web app) always resolve to the config default.
 */
const STORAGE_KEY = "api_base_url";

// Module-level shared state: one override ref across every consumer.
const override = ref<string | null>(null);
let initialized = false;

function initialize() {
	if (initialized || !import.meta.client) return;
	initialized = true;
	// Normalize on load so an override stored before a normalization change
	// (e.g. one missing its `http://` scheme) self-heals.
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) {
		const normalized = normalize(stored);
		override.value = normalized;
		if (normalized !== stored) localStorage.setItem(STORAGE_KEY, normalized);
	}
}

/**
 * Normalize a user-entered server URL into an absolute base the SDK accepts:
 * trim it, prepend `http://` when no scheme is given (a bare `127.0.0.1:8080`
 * would otherwise be treated as a relative URL and every request would fail),
 * and ensure a single trailing slash.
 */
function normalize(url: string): string {
	let value = url.trim();
	if (!value) return value;
	if (!/^https?:\/\//i.test(value)) value = `http://${value}`;
	return value.endsWith("/") ? value : `${value}/`;
}

export function useApiBaseUrl(): {
	/** The effective base URL: the override when set, else the config default. */
	baseUrl: Ref<string>;
	/** The user's override, or null when unset (falling back to the default). */
	override: Ref<string | null>;
	/** The build-time default, for showing as a placeholder / reset target. */
	defaultUrl: string;
	/** Persist an override; empty/whitespace clears it back to the default. */
	setOverride: (url: string) => void;
} {
	initialize();
	const defaultUrl = useRuntimeConfig().public.nvisyApiUrl as string;

	const baseUrl = computed(() => override.value || defaultUrl);

	function setOverride(url: string) {
		const value = normalize(url);
		if (value) {
			override.value = value;
			if (import.meta.client) localStorage.setItem(STORAGE_KEY, value);
		} else {
			override.value = null;
			if (import.meta.client) localStorage.removeItem(STORAGE_KEY);
		}
	}

	return { baseUrl, override, defaultUrl, setOverride };
}
