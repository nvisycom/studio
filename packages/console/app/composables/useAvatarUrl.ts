/**
 * Resolve an `avatarUrl` serve path from the API into a URL usable in an
 * `<img src>`.
 *
 * Avatars are served from public, content-hash-versioned routes
 * (`/avatars/accounts/{id}/{version}/`), so the value loads directly in an
 * `<img>` — no auth header, cross-origin included. `avatarUrl` is a path
 * relative to the API base (already correctly slashed by the server), which
 * we prefix with `nvisyApiUrl`; an absolute URL is used as-is.
 *
 * If the image can't be loaded (unset, 404, etc.), `EntityAvatar` falls back
 * to the gradient + initials — so an unresolvable value is safe.
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
