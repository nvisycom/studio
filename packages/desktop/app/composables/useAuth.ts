const isAuthenticated = ref(false);
const baseUrl = ref('');
const apiToken = ref('');

export function useAuth() {
  const authenticate = (url: string, token: string) => {
    baseUrl.value = url;
    apiToken.value = token;
    isAuthenticated.value = true;

    // TODO: Store in secure storage
  };

  const logout = () => {
    apiToken.value = '';
    isAuthenticated.value = false;
  };

  return {
    isAuthenticated,
    baseUrl,
    apiToken,
    authenticate,
    logout,
  };
}
