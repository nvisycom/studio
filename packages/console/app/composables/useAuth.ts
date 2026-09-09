import {
	login as sdkLogin,
	signup as sdkSignup,
	startOidcSignIn as sdkStartOidcSignIn,
} from "@nvisy/sdk/standalone";
import type { Login, Signup, IdentityProvider } from "@nvisy/sdk/datatypes";

// The browser session lives in two server-set cookies: an HttpOnly `nvisy.session`
// (the JWT, unreadable by script) and a readable `nvisy.csrf` echoed back on
// state-changing requests. Both are set on login and cleared on logout, so the
// readable one's presence is the client's "signed in" signal — the HttpOnly one
// can't be read.
const CSRF_COOKIE_NAME = "nvisy.csrf";

// Reactive mirror of the CSRF cookie's presence. `useCookie` is reactive to our
// own writes (login/logout) but not to a value set by a server redirect (the
// OIDC callback), so it's re-read on app init and after such returns.
const sessionActive = ref(false);
let initialized = false;

function readCsrfCookie(): boolean {
	if (!import.meta.client) return false;
	return document.cookie
		.split("; ")
		.some((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
}

function initializeAuth() {
	if (initialized || !import.meta.client) return;
	initialized = true;
	sessionActive.value = readCsrfCookie();
}

/**
 * Composable for authentication operations.
 *
 * Auth is cookie-based: `login`/`signup`/OIDC set the session cookies
 * server-side and return nothing. The client tracks only whether a session is
 * active (the readable CSRF cookie's presence); the sliding session refreshes
 * on each request, and any 401/403 clears the session (see the SDK plugin).
 */
export function useAuth() {
	initializeAuth();

	const queryCache = useQueryCache();
	// Login/signup run before the app client is built, so they hit the API
	// directly with the effective base URL and injected fetch (desktop: Tauri's
	// native fetch, bypassing CORS) so auth reaches the same server the app uses.
	const { baseUrl } = useApiBaseUrl();
	const { apiFetch } = useApiFetch();
	const { desktopToken, isDesktop } = useDesktopAuth();

	// Desktop authenticates with a bearer token (external-browser sign-in), the
	// web with cookies. On desktop the session marker is the token's presence; on
	// the web it's the readable CSRF cookie.
	const isAuthenticated = computed(() =>
		isDesktop.value ? desktopToken.value !== null : sessionActive.value,
	);

	// Re-read the session marker from the cookies, e.g. after an OIDC redirect
	// back set them without going through login().
	function syncSession() {
		sessionActive.value = readCsrfCookie();
	}

	const loginMutation = useMutation({
		mutation: async (credentials: Login) => {
			await sdkLogin(credentials, {
				baseUrl: baseUrl.value,
				fetch: apiFetch.value,
			});
		},
		onSuccess() {
			syncSession();
		},
	});

	const signupMutation = useMutation({
		mutation: async (details: Signup) => {
			await sdkSignup(details, {
				baseUrl: baseUrl.value,
				fetch: apiFetch.value,
			});
		},
		onSuccess() {
			syncSession();
		},
	});

	// Begin an OIDC sign-in: ask the server for the provider's authorize URL. The
	// caller sends the browser there; the provider's callback is handled
	// server-side, which signs the user in (setting the session cookies) and
	// redirects back to `redirectUri`. Runs before the app client exists, so it
	// uses the standalone function with the effective base URL and injected fetch.
	async function startOidcSignIn(
		provider: IdentityProvider,
		redirectUri?: string,
	) {
		return await sdkStartOidcSignIn(
			provider,
			redirectUri ? { redirectUri } : undefined,
			{ baseUrl: baseUrl.value, fetch: apiFetch.value },
		);
	}

	// Drop all local session state without calling the API. Safe to call from a
	// failed-request handler (won't trigger further requests). The server's
	// cookies are cleared by the logout endpoint (see logout) or expire; this
	// clears the client's view and cached data.
	function clearAuth() {
		sessionActive.value = false;
		// Desktop: drop the bearer token from the OS keychain (no-op on the web).
		runDesktopSignOut();
		if (import.meta.client) {
			// Drop the persisted Studio open-files so the next account doesn't
			// inherit (and fail to load) the previous user's tabs.
			localStorage.removeItem(STUDIO_OPEN_FILES_KEY);
		}

		// Clear workspace cookie
		const workspaceCookie = useCookie("current_workspace_slug");
		workspaceCookie.value = null;

		// Drop every cached query so the next account never sees the previous
		// user's data. Without this, colada keeps entries (e.g. the workspace
		// list) across logout→login; a stale-but-"fresh" entry then makes
		// refresh() a no-op, so a newly-created workspace never appears until a
		// hard reload.
		for (const entry of queryCache.getEntries()) queryCache.remove(entry);
	}

	async function logout() {
		const { $nvisyClient } = useNuxtApp();
		const client = $nvisyClient.value;
		if (client) {
			try {
				// Clears the server's session + CSRF cookies.
				await client.auth.logoutAccount();
			} catch {
				// Ignore errors - we're logging out anyway
			}
		}

		clearAuth();
		navigateTo("/auth/login");
	}

	return {
		// State
		isAuthenticated,
		syncSession,
		clearAuth,

		// Login
		login: loginMutation.mutate,
		loginAsync: loginMutation.mutateAsync,
		isLoggingIn: loginMutation.isLoading,
		loginError: loginMutation.error,

		// Signup
		signup: signupMutation.mutate,
		signupAsync: signupMutation.mutateAsync,
		isSigningUp: signupMutation.isLoading,
		signupError: signupMutation.error,

		// OIDC sign-in
		startOidcSignIn,

		// Logout
		logout,
	};
}
