/**
 * Resolve an `avatarUrl` serve path from the API into a URL usable in an
 * `<img src>`.
 *
 * The API returns `avatarUrl` as a "serve path": it may be an absolute URL
 * (used as-is) or a path relative to the API base (e.g.
 * `/accounts/{username}/avatar/`), which we prefix with `nvisyApiUrl`.
 *
 * If the resolved image can't be loaded (unset, 404, or an auth-gated
 * endpoint that a bare `<img>` can't satisfy), `EntityAvatar` falls back to
 * the gradient + initials — so passing an unresolvable value here is safe.
 */
export function useAvatarUrl() {
	const config = useRuntimeConfig();

	function resolveAvatarUrl(
		path: string | null | undefined,
	): string | undefined {
		if (!path) return undefined;
		if (/^https?:\/\//i.test(path)) return path;

		const base = String(config.public.nvisyApiUrl ?? "").replace(/\/+$/, "");
		const suffix = path.replace(/^\/+/, "");
		return `${base}/${suffix}`;
	}

	return { resolveAvatarUrl };
}
