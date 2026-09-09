<script setup lang="ts">
import { ChevronDown, ExternalLink, Loader2 } from "@lucide/vue";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { NvisyLogo } from "#console/components/brand";
import ThemeToggle from "#console/components/layout/footer/ThemeToggle.vue";
import LanguageSwitcher from "#console/components/layout/footer/LanguageSwitcher.vue";

const { t } = useI18n();

useHead({ title: () => t("auth.login.title") });

// No dashboard chrome on the login screen — there's no active workspace yet.
definePageMeta({
	layout: false,
});

// A user-actionable sign-in error: either the browser flow failed and the
// server bounced back with `?signin=error`, or launching the browser itself
// failed (set in `beginBrowserSignIn`). A successful sign-in lands the token via
// the deep link (handled by the desktop-auth plugin) and never returns here.
const route = useRoute();
const signInError = ref<string | null>(null);
if (route.query.signin === "error") {
	signInError.value = t("auth.login.browser.failed");
}

// Server URL: desktop connects to a user-specified (e.g. self-hosted) server.
// The field edits the persisted override; blank falls back to the default. The
// SDK client rebuilds automatically when this changes (see the nvisy-sdk plugin).
const { override, defaultUrl, setOverride } = useApiBaseUrl();
const serverUrl = ref(override.value ?? "");
// Reveal the field by default when an override is already set, so a configured
// server is visible on return rather than hidden behind the disclosure.
const showServer = ref(override.value != null);

const serverError = ref<string | null>(null);

// Pre-flight reachability check for the entered server URL, so the user can
// verify a self-hosted server before login instead of discovering a bad URL by
// failing to sign in.
const {
	result: probe,
	check: checkServer,
	reset: resetProbe,
} = useServerProbe();

function applyServer() {
	serverError.value = setOverride(serverUrl.value)
		? null
		: t("auth.server.invalid");
}

// Editing the URL invalidates any prior probe result — reset so a stale "reachable"
// doesn't linger against a changed address.
function onServerInput() {
	resetProbe();
}

// Clear the override back to the build-time default (the hosted server). The
// field empties and the override is dropped; the `override` watch re-probes the
// default. If it was already the default (no override to clear), probe directly.
function useDefaultServer() {
	serverUrl.value = "";
	serverError.value = null;
	if (override.value === null) checkServer(defaultUrl);
	else setOverride("");
}

// Probe the server the app will actually use, so the status reflects live
// reachability instead of an unverified assumption — the hosted default can be
// down like any other. Runs on mount and whenever the committed server changes
// (a switch, or "Use default"); a manual edit clears it to idle via
// `onServerInput`, and blur / "Check" re-probe what the user typed.
onMounted(() => checkServer(override.value ?? defaultUrl));
watch(override, (value) => checkServer(value ?? defaultUrl));

// Whether a custom server is configured — gates the "Use default" affordance.
const hasOverride = computed(() => override.value != null);

// The server the app will talk to (override, else the hosted default), shown
// on the status row without its scheme so the host reads at a glance.
const effectiveUrl = computed(() => override.value ?? defaultUrl);
const serverHost = computed(() => {
	const url = effectiveUrl.value;
	if (!url) return "";
	try {
		const { host, pathname } = new URL(url);
		return host + (pathname === "/" ? "" : pathname);
	} catch {
		return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
	}
});

// The always-visible connection status: the hero of the section. A state dot +
// plain status makes the server legible before the editor is opened. The status
// reflects only what's actually known: green/reachable is earned by a successful
// probe — never assumed. Until one runs, the state is neutral ("will connect
// to"), because an unchecked server (the hosted default included) may be down.
// `tone` maps to a dot color + text color in the template.
type StatusTone = "ok" | "warn" | "bad" | "muted";
const connectionStatus = computed<{
	tone: StatusTone;
	key: string;
	host: boolean;
}>(() => {
	switch (probe.value.kind) {
		case "checking":
			return { tone: "muted", key: "auth.server.status.checking", host: false };
		case "reachable": {
			const tone: StatusTone =
				probe.value.status === "healthy"
					? "ok"
					: probe.value.status === "degraded"
						? "warn"
						: "bad";
			return { tone, key: "auth.server.status.reachable", host: true };
		}
		case "unreachable":
			return {
				tone: "bad",
				key: "auth.server.status.unreachable",
				host: true,
			};
		case "not-nvisy":
			return { tone: "bad", key: "auth.server.status.notNvisy", host: false };
		default:
			// Idle: no probe has confirmed reachability. Stay neutral and just name
			// the server the app will connect to — don't claim a connection.
			return { tone: "muted", key: "auth.server.status.idle", host: true };
	}
});

// Dot + text color per tone, from the app's semantic palette.
const STATUS_STYLE: Record<StatusTone, { dot: string; text: string }> = {
	ok: { dot: "bg-green-500", text: "text-foreground" },
	warn: { dot: "bg-yellow-500", text: "text-foreground" },
	bad: { dot: "bg-red-500", text: "text-destructive" },
	muted: { dot: "bg-muted-foreground/50", text: "text-muted-foreground" },
};

// The "Check" action. Commit the entered URL first, so a successful check leaves
// the app pointed at the server just verified. Committing a *changed* URL updates
// `override`, whose watcher already re-probes — so only probe here when the value
// didn't change (re-checking the same server), to avoid a duplicate request. The
// effective URL (field, else the default) is probed, so the hosted default can be
// checked too, not only a typed-in override.
function runCheck() {
	const before = override.value;
	applyServer();
	if (override.value === before)
		checkServer(serverUrl.value.trim() || defaultUrl);
}

// The probe result as a rendered line under the field: the "checking" progress
// note, or a problem (unreachable / not-nvisy / invalid) the user must act on. A
// reachable server needs no line — its status already leads the collapsible's
// header — so it returns null. Idle also returns null but shows the field's
// guidance line instead (see the template), so it's distinguished below.
const probeView = computed(() => {
	switch (probe.value.kind) {
		case "checking":
			return { tone: "muted", key: "auth.server.probe.checking" };
		case "unreachable":
			return { tone: "bad", key: "auth.server.probe.unreachable" };
		case "not-nvisy":
			return { tone: "bad", key: "auth.server.probe.notNvisy" };
		case "invalid":
			return { tone: "bad", key: "auth.server.invalid" };
		default:
			// Idle or reachable: no probe line here.
			return null;
	}
});

// Only the idle state shows the field's guidance line; a reachable probe shows
// nothing (both leave `probeView` null, so distinguish them here).
const showGuidance = computed(() => probe.value.kind === "idle");

// The desktop signs in through the system browser (external-browser auth), not
// an in-app password form: the webview can't reach a self-hosted API origin
// (CORS) or read the session cookie the web flow sets, and Google/Microsoft
// block OAuth inside embedded webviews. So we open the real browser to the web
// console's login page, carrying a `redirect_uri` deep link. The console logs
// the user in (password or OIDC), mints a native-app token from that session
// (`mintDesktopToken`), and redirects it back to the deep link with the token in
// the query; the Rust shell captures it and hands it to the frontend (see the
// desktop-auth plugin and nvisycom/server#285). This page only launches that.

// The deep-link URI the console redirects the token back to. The scheme is
// registered by the Tauri shell (tauri.conf.json → deep-link) and captured in
// auth.rs; the server must allow-list this exact target.
const CALLBACK_URI = "nvisy://auth/callback";

// The build-time hosted web console origin (used when no self-hosted server is
// configured). Overridden at build time via `NUXT_PUBLIC_WEB_APP_URL`.
const webAppUrl = useRuntimeConfig().public.webAppUrl as string;

// Where the browser opens for sign-in: the web console origin, NOT the API (the
// console is a separate Nuxt app — :3000 in dev, app.nvisy.com in prod). The app
// runs on `tauri://`, so it can't use its own origin. With a self-hosted server
// (an override), the console is served alongside the API at that same origin, so
// mint + sign-in happen against the server the app actually talks to; on the
// hosted default it's the separate `webAppUrl`.
const consoleBaseUrl = computed(() => {
	if (!override.value) return webAppUrl;
	try {
		return new URL(override.value).origin;
	} catch {
		return webAppUrl;
	}
});

// True while the system browser is open for sign-in. The actual sign-in
// completes out-of-process (the deep link lands via the desktop-auth plugin and
// navigates to the app), so this stays true until then; it disables the button
// and shows the "continue in your browser" hint. Reset if the launch itself
// fails or the user comes back to the window without finishing.
const awaitingBrowser = ref(false);

async function beginBrowserSignIn(): Promise<void> {
	signInError.value = null;

	// Commit any edited server URL first, so we authorize against the server the
	// app will actually talk to. An invalid entry blocks the flow and reveals the
	// field to be corrected.
	applyServer();
	if (serverError.value) {
		showServer.value = true;
		return;
	}

	try {
		// The web console's login page, carrying the deep-link `redirect_uri` so it
		// mints and hands the token back to the app rather than entering the console.
		// `new URL` can throw on a malformed base — kept inside the try so a bad
		// console URL surfaces as an error rather than an unhandled rejection.
		const authorizeUrl = new URL("/auth/login", consoleBaseUrl.value);
		authorizeUrl.searchParams.set("redirect_uri", CALLBACK_URI);
		awaitingBrowser.value = true;
		await openUrl(authorizeUrl.toString());
	} catch {
		// Couldn't hand off to the browser at all — surface it and reveal the
		// server field, since a bad URL is the likeliest cause.
		awaitingBrowser.value = false;
		signInError.value = t("auth.login.browser.openFailed");
		showServer.value = true;
	}
}

// Re-enable the button when the user returns to the window without completing
// sign-in (they cancelled in the browser, or it failed). A successful sign-in
// navigates away via the deep link before this matters.
function onWindowFocus() {
	if (awaitingBrowser.value) awaitingBrowser.value = false;
}
onMounted(() => window.addEventListener("focus", onWindowFocus));
onBeforeUnmount(() => window.removeEventListener("focus", onWindowFocus));
</script>

<template>
  <div class="relative flex min-h-screen flex-col bg-background">
    <header class="app-titlebar-inset flex items-center justify-end gap-2 px-6 py-4">
      <LanguageSwitcher />
      <ThemeToggle />
    </header>

    <main class="flex flex-1 items-center justify-center px-4">
      <div class="w-full max-w-sm space-y-6">
        <div class="flex flex-col items-center space-y-3 text-center">
          <NvisyLogo :size="34" class="text-foreground" />
          <div class="space-y-1.5">
            <h1 class="text-2xl font-semibold tracking-tight">
              {{ t("auth.login.heading") }}
            </h1>
            <p class="text-sm text-muted-foreground">
              {{ t("auth.login.subtitle") }}
            </p>
          </div>
        </div>

        <!-- Server connection. Status-forward: the always-visible row leads with a
             state dot + plain status + the server host, so the connection reads at
             a glance. It opens the editor to change or verify the server. -->
        <div class="overflow-hidden rounded-lg border border-border/60">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
            :aria-expanded="showServer"
            @click="showServer = !showServer"
          >
            <span
              class="size-2 shrink-0 rounded-full"
              :class="STATUS_STYLE[connectionStatus.tone].dot"
            />
            <span class="flex min-w-0 flex-1 items-baseline gap-1.5 text-sm">
              <span
                class="shrink-0"
                :class="STATUS_STYLE[connectionStatus.tone].text"
              >
                {{ t(connectionStatus.key) }}
              </span>
              <span
                v-if="connectionStatus.host"
                class="truncate font-mono text-xs text-muted-foreground"
                >{{ serverHost }}</span
              >
            </span>
            <ChevronDown
              :size="15"
              class="shrink-0 text-muted-foreground transition-transform"
              :class="showServer ? 'rotate-180' : ''"
            />
          </button>

          <div
            v-if="showServer"
            class="space-y-3 border-t border-border/60 bg-muted/20 p-3"
          >
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <Label for="server" class="text-xs text-muted-foreground">
                  {{ t("auth.server.label") }}
                </Label>
                <button
                  v-if="hasOverride"
                  type="button"
                  class="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  @click="useDefaultServer"
                >
                  {{ t("auth.server.reset") }}
                </button>
              </div>
              <div class="flex gap-2">
                <Input
                  id="server"
                  v-model="serverUrl"
                  type="url"
                  inputmode="url"
                  :placeholder="defaultUrl || t('auth.server.placeholder')"
                  class="h-10 flex-1 bg-background font-mono text-sm"
                  autocomplete="off"
                  @input="onServerInput"
                  @change="applyServer"
                  @blur="applyServer"
                />
                <Button
                  type="button"
                  variant="outline"
                  class="h-10 shrink-0 bg-background"
                  :disabled="probe.kind === 'checking'"
                  @click="runCheck"
                >
                  <Loader2
                    v-if="probe.kind === 'checking'"
                    :size="14"
                    class="mr-1.5 animate-spin"
                  />
                  {{ t("auth.server.check") }}
                </Button>
              </div>
            </div>

            <!-- Probe line: the checking note or a problem the user must act on.
                 A reachable server shows nothing (its status leads the header);
                 the idle state shows the field's guidance line instead. -->
            <p
              v-if="probeView"
              class="flex items-center gap-1.5 text-xs"
              :class="{
                'text-muted-foreground': probeView.tone === 'muted',
                'text-destructive': probeView.tone === 'bad',
              }"
            >
              <Loader2
                v-if="probe.kind === 'checking'"
                :size="12"
                class="animate-spin"
              />
              {{ t(probeView.key) }}
            </p>
            <p
              v-else-if="showGuidance"
              class="text-xs"
              :class="serverError ? 'text-destructive' : 'text-muted-foreground'"
            >
              {{ serverError ?? t("auth.server.description") }}
            </p>

          </div>
        </div>

        <div class="space-y-4">
          <div
            v-if="signInError"
            class="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {{ signInError }}
          </div>

          <Button
            type="button"
            class="h-10 w-full"
            :disabled="awaitingBrowser"
            @click="beginBrowserSignIn"
          >
            <Loader2 v-if="awaitingBrowser" :size="16" class="mr-2 animate-spin" />
            <ExternalLink v-else :size="16" class="mr-2" />
            {{
              awaitingBrowser
                ? t("auth.login.browser.waiting")
                : t("auth.login.browser.submit")
            }}
          </Button>

          <p class="text-center text-xs text-muted-foreground">
            {{ t("auth.login.browser.hint") }}
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
