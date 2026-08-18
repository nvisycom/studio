/**
 * Validate a post-login redirect target. Only a same-origin absolute path is
 * allowed — anything else (a protocol-relative `//host`, an absolute URL, or a
 * non-string) is rejected to avoid an open-redirect. Returns the safe path, or
 * `null` when there's nothing safe to redirect to.
 */
export function safeRedirectPath(target: unknown): string | null {
	if (typeof target !== "string") return null;
	if (!target.startsWith("/") || target.startsWith("//")) return null;
	if (target === "/") return null; // the default landing — no need to preserve
	return target;
}
