/**
 * Global workspace middleware.
 *
 * Workspace features live under `/w/[workspace]/...`. This resolves the landing
 * route (`/`) into the last-used workspace, so authenticated users always land
 * on a concrete `/w/{slug}/...` URL.
 */
export default defineNuxtRouteMiddleware((to) => {
	// SPA-only; auth state and the last-used cookie live client-side.
	if (import.meta.server) return;

	// Non-workspace routes render as-is.
	const freeRoutes = ["/auth", "/account", "/join"];
	if (freeRoutes.some((r) => to.path === r || to.path.startsWith(`${r}/`))) {
		return;
	}

	const { isAuthenticated } = useAuth();
	if (!isAuthenticated.value) return; // auth middleware handles the redirect

	// Already inside a workspace: the slug's validity is confirmed on the page
	// once the workspace list loads.
	if (typeof to.params.workspace === "string" && to.params.workspace) return;

	// Landing / bare route: send the user into their last-used workspace.
	const lastWorkspaceSlug = useCookie<string | null>("current_workspace_slug");
	if (lastWorkspaceSlug.value) {
		return navigateTo(`/w/${lastWorkspaceSlug.value}`);
	}
	// No known workspace yet: stay on "/", where the shell prompts to pick or
	// create one once the workspace list resolves.
});
