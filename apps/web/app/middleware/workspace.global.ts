/**
 * Global workspace middleware
 * Redirects to overview when no workspace is selected
 */
export default defineNuxtRouteMiddleware((to) => {
	// Skip middleware on server-side
	if (import.meta.server) return;

	// Routes that don't require a workspace
	const workspaceFreeRoutes = [
		"/",
		"/auth",
		"/account",
		"/billing",
		"/settings",
		"/join",
	];

	const isWorkspaceFreeRoute = workspaceFreeRoutes.some(
		(route) => to.path === route || to.path.startsWith(`${route}/`),
	);

	if (isWorkspaceFreeRoute) return;

	// Check if user is authenticated first
	const { isAuthenticated } = useAuth();
	if (!isAuthenticated.value) return;

	// Check if workspace is selected
	const currentWorkspaceSlug = useCookie<string | null>(
		"current_workspace_slug",
	);

	if (!currentWorkspaceSlug.value) {
		return navigateTo("/");
	}
});
