/**
 * Build workspace-scoped links. Workspace feature routes live under
 * `/w/{slug}/...`; `wLink` prefixes an app-relative path with the active
 * workspace slug so call sites write `wLink("/files")` rather than
 * interpolating the slug themselves.
 *
 * Non-workspace routes (`/auth/*`, `/account/*`, `/join/*`) are not scoped and
 * should be passed to `NuxtLink`/`navigateTo` directly.
 */
export function useWorkspaceLink() {
	const { currentWorkspaceSlug } = useWorkspaces();

	function wLink(path = "/"): string {
		const slug = currentWorkspaceSlug.value;
		if (!slug) return "/";
		if (path === "/" || path === "") return `/w/${slug}`;
		return `/w/${slug}/${path.replace(/^\/+/, "")}`;
	}

	return { wLink };
}
