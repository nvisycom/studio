/**
 * Global authentication middleware
 * Redirects unauthenticated users to login page
 * Redirects authenticated users away from auth pages
 */
export default defineNuxtRouteMiddleware((to) => {
	// Skip middleware on server-side (auth state is in localStorage)
	if (import.meta.server) return;

	// Auth routes (login/signup) - redirect to home if already authenticated
	const authRoutes = ["/auth/login", "/auth/signup"];

	// Public routes that don't require authentication
	const publicRoutes = [
		...authRoutes,
		"/auth/forgot-password",
		"/auth/reset-password",
	];

	const isAuthRoute = authRoutes.some(
		(route) => to.path === route || to.path.startsWith(`${route}/`),
	);

	const isPublicRoute = publicRoutes.some(
		(route) => to.path === route || to.path.startsWith(`${route}/`),
	);

	// Check authentication
	const { isAuthenticated } = useAuth();

	// Redirect authenticated users away from login/signup
	if (isAuthRoute && isAuthenticated.value) {
		return navigateTo("/");
	}

	if (isPublicRoute) return;

	if (!isAuthenticated.value) {
		return navigateTo("/auth/login");
	}
});
