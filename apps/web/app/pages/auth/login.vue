<script setup lang="ts">
import { Eye, EyeOff, Loader2 } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Checkbox } from "#console/components/ui/checkbox";
import { FeatureGate } from "#console/components/shared";
import { NvisyApiError } from "@nvisy/sdk";
import type { IdentityProvider } from "@nvisy/sdk/datatypes";
import { toast } from "vue-sonner";

const { t } = useI18n();

useHead({ title: () => t("auth.login.title") });

definePageMeta({
	layout: "auth",
});

const {
	loginAsync,
	isLoggingIn,
	loginError,
	startOidcSignIn,
	syncSession,
	isAuthenticated,
} = useAuth();

// Desktop external-browser sign-in: when the desktop app opened this page in the
// system browser, it passed a `redirect_uri` deep link. After login we mint a
// native-app token and hand it back on that link instead of entering the app
// here. On the plain web there's no `redirect_uri` and this is inert.
const { callbackFromRoute, tryDesktopHandoff } = useDesktopSignInReturn();

const apiError = computed(() =>
	loginError.value instanceof NvisyApiError ? loginError.value : null,
);

// Form state. The identifier accepts an email OR a username (the SDK's Login
// takes a single `identifier`), so it isn't constrained to email input.
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
	} catch {
		// A failed login is surfaced via the mutation's error state.
		return;
	}
	// Desktop flow: hand the token back to the app and stop here (owns its own
	// error toast). Otherwise return the user to where they were headed.
	if (await tryDesktopHandoff()) return;
	navigateTo(safeRedirectPath(useRoute().query.redirect) ?? "/");
}

// Sign in with an OIDC provider: ask the server for the provider's authorize
// URL and hand the browser to it. The server's callback signs the user in
// (setting the session cookies) and redirects back here with `?signin=...`; the
// return handler below finishes the flow. We come back to this page (carrying
// the intended `redirect`) rather than straight to the destination, so the
// return handler runs before the app shell mounts. A full navigation.
const oidcPending = ref<IdentityProvider | null>(null);

async function handleOidcSignIn(provider: IdentityProvider): Promise<void> {
	oidcPending.value = provider;
	try {
		const returnUrl = new URL("/auth/login", window.location.origin);
		const dest = safeRedirectPath(useRoute().query.redirect);
		if (dest) returnUrl.searchParams.set("redirect", dest);
		// Carry the desktop deep link through the OIDC round-trip so the return
		// handler can mint and hand off the token after the provider signs us in.
		const callback = callbackFromRoute();
		if (callback) returnUrl.searchParams.set("redirect_uri", callback);
		const { authorizeUrl } = await startOidcSignIn(
			provider,
			returnUrl.toString(),
		);
		window.location.href = authorizeUrl;
	} catch {
		oidcPending.value = null;
		toast.error(t("auth.shared.oidcFailed"));
	}
}

const handleGoogleLogin = () => handleOidcSignIn("google");
const handleMicrosoftLogin = () => handleOidcSignIn("microsoft");

// OIDC return: the server redirected back with `?signin=success|error` after
// setting (or failing to set) the session cookies. On success, adopt the
// session and continue to the intended destination; on error, surface it.
onMounted(async () => {
	const route = useRoute();

	// Desktop sign-in with an existing web session: the user is already
	// authenticated (the auth middleware let this page render because of the
	// `redirect_uri`), so there's nothing to log in — mint and hand off the token
	// straight away instead of making them re-enter credentials.
	if (isAuthenticated.value && (await tryDesktopHandoff())) return;

	const signin = route.query.signin;
	if (!signin) return;
	if (signin === "success") {
		syncSession();
		// Desktop flow hands the token back on the deep link carried through the
		// round-trip; otherwise land in the app here.
		if (await tryDesktopHandoff()) return;
		navigateTo(safeRedirectPath(route.query.redirect) ?? "/");
	} else {
		toast.error(t("auth.shared.oidcFailed"));
		// Drop only `signin` so a reload doesn't re-toast — keep `redirect` and the
		// desktop `redirect_uri` so a retry still carries the callback.
		const { signin: _drop, ...rest } = route.query;
		navigateTo({ query: rest }, { replace: true });
	}
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="space-y-2 text-center">
      <h1 class="text-2xl font-semibold tracking-tight">
        {{ t("auth.login.heading") }}
      </h1>
      <p class="text-sm text-muted-foreground">
        {{ t("auth.login.subtitle") }}
      </p>
    </div>

    <FeatureGate feature="oauth">
      <!-- Social Login Buttons -->
      <div class="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          class="h-10"
          :disabled="oidcPending !== null"
          @click="handleGoogleLogin"
        >
          <Loader2
            v-if="oidcPending === 'google'"
            class="mr-2 h-4 w-4 animate-spin"
          />
          <img
            v-else
            src="~/assets/brands/google.png"
            :alt="t('auth.shared.google')"
            class="mr-2 h-4 w-4"
          />
          {{ t("auth.shared.google") }}
        </Button>
        <Button
          type="button"
          variant="outline"
          class="h-10"
          :disabled="oidcPending !== null"
          @click="handleMicrosoftLogin"
        >
          <Loader2
            v-if="oidcPending === 'microsoft'"
            class="mr-2 h-4 w-4 animate-spin"
          />
          <img
            v-else
            src="~/assets/brands/microsoft.png"
            :alt="t('auth.shared.microsoft')"
            class="mr-2 h-4 w-4"
          />
          {{ t("auth.shared.microsoft") }}
        </Button>
      </div>

      <!-- Divider -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border" />
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-background px-2 text-muted-foreground">
            {{ t("auth.shared.orContinueWithEmail") }}
          </span>
        </div>
      </div>
    </FeatureGate>

    <!-- Form -->
    <form @submit.prevent="handleLogin" class="space-y-4">
      <!-- Email or username -->
      <div class="space-y-2">
        <Label for="identifier" required>{{ t("auth.login.identifier") }}</Label>
        <Input
          id="identifier"
          name="identifier"
          v-model="identifier"
          type="text"
          :placeholder="t('auth.login.identifierPlaceholder')"
          class="h-10"
          required
          autocomplete="username"
        />
      </div>

      <!-- Password -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label for="password" required>{{ t("auth.shared.password") }}</Label>
          <NuxtLink
            to="/auth/forgot-password"
            class="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {{ t("auth.login.forgotPassword") }}
          </NuxtLink>
        </div>
        <div class="relative">
          <Input
            id="password"
            name="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="t('auth.login.passwordPlaceholder')"
            class="h-10 pr-10"
            required
            autocomplete="current-password"
          />
          <button
            type="button"
            :aria-label="
              showPassword ? t('common.hidePassword') : t('common.showPassword')
            "
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye v-if="!showPassword" :size="16" />
            <EyeOff v-else :size="16" />
          </button>
        </div>
      </div>

      <!-- Remember Me -->
      <div class="flex items-center gap-2">
        <Checkbox id="remember" v-model="rememberMe" />
        <Label
          for="remember"
          class="text-sm font-normal cursor-pointer text-muted-foreground"
        >
          {{ t("auth.login.rememberMe") }}
        </Label>
      </div>

      <!-- Error Message -->
      <div
        v-if="loginError"
        class="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
      >
        <p>{{ loginError.message || t("auth.login.genericError") }}</p>
        <p v-if="apiError?.suggestion" class="mt-1 opacity-80">
          {{ apiError.suggestion }}
        </p>
        <ul
          v-if="apiError?.validation?.length"
          class="mt-2 list-disc list-inside space-y-1"
        >
          <li v-for="err in apiError.validation" :key="err.field">
            <span class="font-medium">{{ err.field }}:</span> {{ err.message }}
          </li>
        </ul>
      </div>

      <!-- Submit Button -->
      <Button type="submit" class="w-full h-10" :disabled="isLoggingIn">
        {{ isLoggingIn ? t("auth.login.submitting") : t("auth.login.submit") }}
      </Button>
    </form>

    <!-- Sign Up Link -->
    <p class="text-center text-sm text-muted-foreground">
      {{ t("auth.login.noAccount") }}
      <NuxtLink
        to="/auth/signup"
        class="text-foreground hover:underline font-medium"
      >
        {{ t("auth.shared.signUp") }}
      </NuxtLink>
    </p>
  </div>
</template>
