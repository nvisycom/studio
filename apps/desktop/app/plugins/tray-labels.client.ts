import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * Push localized tray-menu labels to the Rust shell.
 *
 * The tray menu is built natively and can't read the web i18n catalog directly,
 * so we resolve the strings here and hand them over via the `set_tray_labels`
 * command — once on boot and again whenever the user switches language, so the
 * tray always speaks the app's chosen language. The `tray.*` keys live in this
 * app's own locale files (they're desktop-specific), merged into the shared
 * catalog by the Nuxt layer.
 */
export default defineNuxtPlugin((nuxtApp) => {
	// Only meaningful inside the Tauri shell; skip it in a plain browser (dev
	// server without Tauri), where there's no tray and no command to call.
	if (!isTauri()) return;

	// Use the i18n instance off the Nuxt app rather than the `useI18n()`
	// composable — a plugin body isn't a component `setup()`, so composables that
	// require that context would throw.
	const i18n = nuxtApp.$i18n;

	const push = () =>
		invoke("set_tray_labels", {
			labels: {
				openStudio: i18n.t("tray.openStudio"),
				minimizeToTray: i18n.t("tray.minimizeToTray"),
				spotlight: i18n.t("tray.spotlight"),
				enableNotifications: i18n.t("tray.enableNotifications"),
				disableNotifications: i18n.t("tray.disableNotifications"),
				quit: i18n.t("tray.quit"),
			},
		}).catch(() => {});

	// Push once the app is mounted (i18n messages are ready), then again whenever
	// the locale changes.
	nuxtApp.hook("app:mounted", () => {
		push();
	});
	watch(i18n.locale, () => {
		push();
	});
});
