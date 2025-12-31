/**
 * Global authentication middleware
 * Redirects unauthenticated users to login page
 */
export default defineNuxtRouteMiddleware((to) => {
	// Skip middleware on server-side (auth state is in localStorage)
	if (import.meta.server) return;

	// Public routes that don't require authentication
	const publicRoutes = [
		"/auth/login",
		"/auth/signup",
		"/auth/forgot-password",
		"/auth/reset-password",
	];

	const isPublicRoute = publicRoutes.some(
		(route) => to.path === route || to.path.startsWith(route + "/"),
	);

	if (isPublicRoute) return;

	// Check authentication
	const { isAuthenticated } = useAuth();

	if (!isAuthenticated.value) {
		return navigateTo("/auth/login");
	}
});
