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
	// Re-normalize on load so an override stored before a normalization change
	// self-heals (a missing scheme, a value now considered invalid). A stored
	// value that no longer normalizes is dropped rather than kept broken.
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return;
	const normalized = normalize(stored);
	override.value = normalized;
	if (normalized) {
		if (normalized !== stored) localStorage.setItem(STORAGE_KEY, normalized);
	} else {
		localStorage.removeItem(STORAGE_KEY);
	}
}

/**
 * Whether a URL's hostname is a loopback address (safe over plaintext HTTP).
 * `URL.hostname` keeps the brackets for IPv6 (`[::1]`), so strip them first.
 */
function isLoopbackHost(hostname: string): boolean {
	const host = hostname.replace(/^\[|\]$/g, "");
	return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

/**
 * Normalize a user-entered server URL into an absolute base the SDK accepts:
 * trim it, add a scheme when none is given, and ensure a single trailing slash
 * (a bare `127.0.0.1:8080` would otherwise be treated as a relative URL and
 * every request would fail). Returns `null` for anything that isn't a usable
 * http(s) URL (a bare `http://`, an unsupported scheme like `ftp://`, garbage).
 *
 * A schemeless host defaults to `https://` so credentials and the bearer token
 * aren't sent in plaintext to a remote server — except loopback hosts (the
 * local dev API), which default to `http://` since they don't have TLS. The host
 * is resolved with `URL` parsing so bracketed IPv6 (`[::1]:8080`) is handled.
 */
export function normalize(url: string): string | null {
	const value = url.trim();
	if (!value) return null;

	const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
	// Parse to resolve the real host. For schemeless input, borrow `http://` so
	// URL parsing succeeds, then pick the scheme from the resolved host.
	let parsed: URL;
	try {
		parsed = new URL(hasScheme ? value : `http://${value}`);
	} catch {
		return null;
	}
	if (!parsed.hostname) return null;

	if (hasScheme) {
		// Only http(s) are supported; reject e.g. ftp:// rather than mangle it.
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return null;
		}
	} else {
		parsed.protocol = isLoopbackHost(parsed.hostname) ? "http:" : "https:";
	}

	const base = parsed.toString();
	return base.endsWith("/") ? base : `${base}/`;
}

export function useApiBaseUrl(): {
	/** The effective base URL: the override when set, else the config default. */
	baseUrl: Ref<string>;
	/** The user's override, or null when unset (falling back to the default). */
	override: Ref<string | null>;
	/** The build-time default, for showing as a placeholder / reset target. */
	defaultUrl: string;
	/**
	 * Persist an override. Empty/whitespace clears it back to the default.
	 * Returns `false` (without persisting) when the input isn't a usable URL —
	 * e.g. a bare `http://` — so the caller can surface a validation message
	 * instead of storing a value that breaks every request.
	 */
	setOverride: (url: string) => boolean;
} {
	initialize();
	const defaultUrl = useRuntimeConfig().public.nvisyApiUrl as string;

	const baseUrl = computed(() => override.value || defaultUrl);

	function setOverride(url: string): boolean {
		// Empty input clears the override (back to the default) — a valid outcome.
		if (!url.trim()) {
			if (override.value === null) return true; // already default; no-op
			override.value = null;
			if (import.meta.client) localStorage.removeItem(STORAGE_KEY);
			return true;
		}
		const value = normalize(url);
		if (!value) return false;
		// No-op when unchanged, so re-applying the same URL (e.g. blur then a
		// "Check server" click) doesn't churn the ref and rebuild the SDK client.
		if (value === override.value) return true;
		override.value = value;
		if (import.meta.client) localStorage.setItem(STORAGE_KEY, value);
		return true;
	}

	return { baseUrl, override, defaultUrl, setOverride };
}
