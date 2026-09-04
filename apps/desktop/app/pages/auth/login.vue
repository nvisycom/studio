<script setup lang="ts">
import { ChevronDown, Eye, EyeOff, Loader2 } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Checkbox } from "#console/components/ui/checkbox";
import { NvisyLogo } from "#console/components/brand";
import ThemeToggle from "#console/components/layout/footer/ThemeToggle.vue";
import LanguageSwitcher from "#console/components/layout/footer/LanguageSwitcher.vue";
import { NvisyApiError } from "@nvisy/sdk";

const { t } = useI18n();

useHead({ title: () => t("auth.login.title") });

// No dashboard chrome on the login screen — there's no active workspace yet.
definePageMeta({
	layout: false,
});

const { loginAsync, isLoggingIn, loginError } = useAuth();

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
// note, or a problem (unreachable / not-nvisy / invalid) the user must act on.
// A reachable server needs no line — its status is already the collapsible's
// header — so it returns null, like idle.
const probeView = computed(() => {
	switch (probe.value.kind) {
		case "checking":
			return { tone: "muted", key: "auth.server.probe.checking", spin: true };
		case "unreachable":
			return { tone: "bad", key: "auth.server.probe.unreachable" };
		case "not-nvisy":
			return { tone: "bad", key: "auth.server.probe.notNvisy" };
		case "invalid":
			return { tone: "bad", key: "auth.server.invalid" };
		default:
			// Idle or reachable: no line to show here.
			return null;
	}
});

const apiError = computed(() =>
	loginError.value instanceof NvisyApiError ? loginError.value : null,
);

// A login error that isn't an API error never reached the server — a bad Server
// URL, the server being down, or a network issue. The raw message ("Load
// failed" / "Failed to fetch") is useless, so show actionable copy that points
// at the Server URL instead.
const isConnectionError = computed(
	() => !!loginError.value && apiError.value === null,
);
const errorMessage = computed(() =>
	isConnectionError.value
		? t("auth.server.connectionError")
		: loginError.value?.message || t("auth.login.genericError"),
);

// Accepts an email OR a username — the SDK's Login takes a single `identifier`.
const identifier = ref("");
const password = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);

async function handleLogin(): Promise<void> {
	try {
		await loginAsync({
			identifier: identifier.value,
			password: password.value,
			rememberMe: rememberMe.value,
		});
		// Return the user to where they were headed before login, if any.
		navigateTo(safeRedirectPath(useRoute().query.redirect) ?? "/");
	} catch {
		// A connection failure usually means the Server URL is wrong — reveal the
		// field so the user can correct it. Auth errors surface via `loginError`.
		if (isConnectionError.value) showServer.value = true;
	}
}
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

            <!-- Probe detail for a problem state, or the field's guidance line
                 when nothing's run. A reachable server shows no line here — its
                 status already leads the collapsible's header (see probeView). -->
            <p
              v-if="probeView && !probeView.spin"
              class="text-xs"
              :class="{
                'text-muted-foreground': probeView.tone === 'muted',
                'text-destructive': probeView.tone === 'bad',
              }"
            >
              {{ t(probeView.key) }}
            </p>
            <p
              v-else-if="!probeView"
              class="text-xs"
              :class="serverError ? 'text-destructive' : 'text-muted-foreground'"
            >
              {{ serverError ?? t("auth.server.description") }}
            </p>

          </div>
        </div>

        <form class="space-y-4" @submit.prevent="handleLogin">
          <div class="space-y-2">
            <Label for="identifier" required>
              {{ t("auth.login.identifier") }}
            </Label>
            <Input
              id="identifier"
              v-model="identifier"
              name="identifier"
              type="text"
              :placeholder="t('auth.login.identifierPlaceholder')"
              class="h-10"
              required
              autocomplete="username"
            />
          </div>

          <div class="space-y-2">
            <Label for="password" required>{{ t("auth.shared.password") }}</Label>
            <div class="relative">
              <Input
                id="password"
                v-model="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="t('auth.login.passwordPlaceholder')"
                class="h-10 pr-10"
                required
                autocomplete="current-password"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                :aria-label="
                  showPassword ? t('common.hidePassword') : t('common.showPassword')
                "
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" :size="16" />
                <EyeOff v-else :size="16" />
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Checkbox id="remember" v-model="rememberMe" />
            <Label
              for="remember"
              class="cursor-pointer text-sm font-normal text-muted-foreground"
            >
              {{ t("auth.login.rememberMe") }}
            </Label>
          </div>

          <div
            v-if="loginError"
            class="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <p>{{ errorMessage }}</p>
            <p v-if="apiError?.suggestion" class="mt-1 opacity-80">
              {{ apiError.suggestion }}
            </p>
            <ul
              v-if="apiError?.validation?.length"
              class="mt-2 list-inside list-disc space-y-1"
            >
              <li v-for="err in apiError.validation" :key="err.field">
                <span class="font-medium">{{ err.field }}:</span> {{ err.message }}
              </li>
            </ul>
          </div>

          <Button type="submit" class="h-10 w-full" :disabled="isLoggingIn">
            {{ isLoggingIn ? t("auth.login.submitting") : t("auth.login.submit") }}
          </Button>
        </form>
      </div>
    </main>
  </div>
</template>
