import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * Push the auth state to the Rust shell.
 *
 * Signed-in state lives in the web layer (localStorage via `useAuth`), but the
 * shell needs it for window decisions — chiefly, it shouldn't summon the
 * auth-only spotlight launcher when signed out (an empty overlay); it opens the
 * main window instead. We report the state via the `set_authed` command on boot
 * and whenever it changes, so the shell always has the current value.
 */
export default defineNuxtPlugin(() => {
	// Only meaningful inside the Tauri shell; a plain browser has no command.
	if (!isTauri()) return;

	const { isAuthenticated } = useAuth();

	const push = (authed: boolean) =>
		invoke("set_authed", { authed }).catch(() => {});

	// Report the current value immediately and on every change (login, logout,
	// token expiry, session restore on launch).
	watch(isAuthenticated, (authed) => push(authed), { immediate: true });
});
