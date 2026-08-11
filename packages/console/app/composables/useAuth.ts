import { login as sdkLogin, signup as sdkSignup } from "@nvisy/sdk/auth";
import type { Login, Signup, AuthToken } from "@nvisy/sdk/datatypes";

const AUTH_STORAGE_KEY = "auth";
const AUTH_COOKIE_NAME = "nvisy_auth";
const AUTH_COOKIE_DOMAIN = ".nvisy.com";
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Global reactive state for auth token
const authToken = ref<AuthToken | null>(null);
let initialized = false;

// Shared cookie for cross-subdomain auth state (nvisy.com <-> app.nvisy.com)
const authCookie = useCookie(AUTH_COOKIE_NAME, {
	domain: AUTH_COOKIE_DOMAIN,
	path: "/",
	secure: true,
	sameSite: "lax",
	maxAge: AUTH_COOKIE_MAX_AGE,
});

function initializeAuth() {
	if (initialized || !import.meta.client) return;
	initialized = true;

	// Initialize from localStorage
	const stored = localStorage.getItem(AUTH_STORAGE_KEY);
	if (stored) {
		try {
			authToken.value = JSON.parse(stored);
			// Ensure cookie is set if we have a valid token
			authCookie.value = "1";
		} catch {
			localStorage.removeItem(AUTH_STORAGE_KEY);
			authCookie.value = null;
		}
	}

	// Sync to localStorage and cookie when token changes
	watch(authToken, (newToken) => {
		if (newToken) {
			localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newToken));
			authCookie.value = "1";
		} else {
			localStorage.removeItem(AUTH_STORAGE_KEY);
			authCookie.value = null;
		}
	});
}

/**
 * Composable for authentication operations
 */
export function useAuth() {
	initializeAuth();

	const config = useRuntimeConfig();
	const queryCache = useQueryCache();

	const isAuthenticated = computed(() => {
		if (!authToken.value) return false;
		const expiresAt = new Date(authToken.value.expiresAt);
		return expiresAt > new Date();
	});

	const loginMutation = useMutation({
		mutation: async (credentials: Login) => {
			return await sdkLogin(credentials, {
				baseUrl: config.public.nvisyApiUrl as string,
			});
		},
		onSuccess(data) {
			authToken.value = data;
		},
	});

	const signupMutation = useMutation({
		mutation: async (details: Signup) => {
			return await sdkSignup(details, {
				baseUrl: config.public.nvisyApiUrl as string,
			});
		},
		onSuccess(data) {
			authToken.value = data;
		},
	});

	// Clear all local auth/session state without calling the API. Safe to call
	// from a failed-request handler (won't trigger further requests).
	function clearAuth() {
		authToken.value = null;
		if (import.meta.client) {
			localStorage.removeItem(AUTH_STORAGE_KEY);
			// Drop the persisted Studio open-files so the next account doesn't
			// inherit (and fail to load) the previous user's tabs.
			localStorage.removeItem(STUDIO_OPEN_FILES_KEY);
		}
		authCookie.value = null;

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
		authToken: readonly(authToken),
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

		// Logout
		logout,
	};
}
