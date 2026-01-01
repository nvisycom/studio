import { useMutation } from "@pinia/colada";
import { login as sdkLogin, signup as sdkSignup } from "@nvisy/sdk/auth";
import type { Login, Signup, AuthToken } from "@nvisy/sdk/datatypes";

const AUTH_STORAGE_KEY = "auth";

// Global reactive state for auth token
const authToken = ref<AuthToken | null>(null);
let initialized = false;

function initializeAuth() {
  if (initialized || !import.meta.client) return;
  initialized = true;

  // Initialize from localStorage
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (stored) {
    try {
      authToken.value = JSON.parse(stored);
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  // Sync to localStorage when token changes
  watch(authToken, (newToken) => {
    if (newToken) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newToken));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  });
}

/**
 * Composable for authentication operations
 */
export function useAuth() {
  initializeAuth();

  const config = useRuntimeConfig();

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

    authToken.value = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);

    // Clear workspace cookie
    const workspaceCookie = useCookie("current_workspace_id");
    workspaceCookie.value = null;

    navigateTo("/auth/login");
  }

  return {
    // State
    isAuthenticated,
    authToken: readonly(authToken),

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
