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
		// Desktop sign-in confirmation: shown in the system browser after the token
		// handoff to the desktop app. Reached with a live session, but it only fires
		// the deep link and shows a "return to the app" message — never the shell.
		"/auth/desktop",
		// The desktop spotlight is a chrome overlay window, not a data view — it
		// must always render its launcher, never redirect to login (which would
		// otherwise show "Welcome back" inside the quick-command window).
		"/spotlight",
	];

	const isAuthRoute = authRoutes.some(
		(route) => to.path === route || to.path.startsWith(`${route}/`),
	);

	const isPublicRoute = publicRoutes.some(
		(route) => to.path === route || to.path.startsWith(`${route}/`),
	);

	// Check authentication
	const { isAuthenticated } = useAuth();
	const { restoringDesktopAuth } = useDesktopAuth();

	// On desktop, the stored token is read from the OS keychain asynchronously at
	// launch (it can even block on a system prompt). Until that read settles,
	// "not authenticated" is not yet a real signed-out state — bouncing to login
	// here would flash the login screen at a returning user and then bounce back
	// once the token lands. Hold the intended route instead; app.vue shows a
	// launch splash while restoring, and the guard re-evaluates on the next
	// navigation once the token has settled.
	if (restoringDesktopAuth.value) return;

	// Desktop external-browser sign-in: the desktop app sends the user here with a
	// `redirect_uri` deep link to mint and hand back a token. That must run even
	// when a web session already exists — an already-signed-in browser is the
	// common case — so never bounce these visits to home; the auth page mints the
	// token and redirects to the deep link itself.
	const isDesktopSignIn =
		isAuthRoute && desktopCallbackUri(to.query.redirect_uri) !== null;

	// Redirect authenticated users away from login/signup
	if (isAuthRoute && isAuthenticated.value && !isDesktopSignIn) {
		return navigateTo("/");
	}

	if (isPublicRoute) return;

	if (!isAuthenticated.value) {
		// Preserve where the user was headed (e.g. an invite at /join/[code],
		// which needs auth to load) so login can return them there afterwards.
		const redirect = safeRedirectPath(to.fullPath);
		return navigateTo({
			path: "/auth/login",
			query: redirect ? { redirect } : undefined,
		});
	}
});
