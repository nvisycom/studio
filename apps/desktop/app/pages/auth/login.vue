<script setup lang="ts">
import { ChevronDown, Eye, EyeOff, Server } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Checkbox } from "#console/components/ui/checkbox";
import ThemeToggle from "#console/components/layout/footer/ThemeToggle.vue";
import { NvisyApiError } from "@nvisy/sdk";

const { t } = useI18n();

useHead({ title: t("auth.login.title") });

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

function applyServer() {
	setOverride(serverUrl.value);
}

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

const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);

async function handleLogin(): Promise<void> {
	try {
		await loginAsync({
			identifier: email.value,
			password: password.value,
			rememberMe: rememberMe.value,
		});
		navigateTo("/");
	} catch {
		// A connection failure usually means the Server URL is wrong — reveal the
		// field so the user can correct it. Auth errors surface via `loginError`.
		if (isConnectionError.value) showServer.value = true;
	}
}
</script>

<template>
  <div class="relative flex min-h-screen flex-col bg-background">
    <header class="flex items-center justify-end px-6 py-4">
      <ThemeToggle />
    </header>

    <main class="flex flex-1 items-center justify-center px-4">
      <div class="w-full max-w-sm space-y-6">
        <div class="space-y-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ t("auth.login.heading") }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ t("auth.login.subtitle") }}
          </p>
        </div>

        <!-- Server settings: which Nvisy server to connect to. Collapsed unless
             an override is already set, so the common case (default server)
             stays uncluttered. -->
        <div class="rounded-lg border border-border/60">
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            @click="showServer = !showServer"
          >
            <Server :size="15" />
            <span class="flex-1 text-left">{{ t("auth.server.advanced") }}</span>
            <ChevronDown
              :size="15"
              class="transition-transform"
              :class="showServer ? 'rotate-180' : ''"
            />
          </button>
          <div v-if="showServer" class="space-y-2 border-t border-border/60 p-3">
            <Label for="server">{{ t("auth.server.label") }}</Label>
            <Input
              id="server"
              v-model="serverUrl"
              type="url"
              inputmode="url"
              :placeholder="defaultUrl || t('auth.server.placeholder')"
              class="h-10 font-mono text-sm"
              autocomplete="off"
              @change="applyServer"
              @blur="applyServer"
            />
            <p class="text-xs text-muted-foreground">
              {{ t("auth.server.description") }}
            </p>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="handleLogin">
          <div class="space-y-2">
            <Label for="email" required>{{ t("auth.shared.email") }}</Label>
            <Input
              id="email"
              v-model="email"
              name="email"
              type="email"
              :placeholder="t('auth.shared.emailPlaceholder')"
              class="h-10"
              required
              autocomplete="email"
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
