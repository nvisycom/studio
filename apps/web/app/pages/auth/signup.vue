<script setup lang="ts">
import { Eye, EyeOff, ExternalLink, Loader2 } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Checkbox } from "#console/components/ui/checkbox";
import type { IdentityProvider } from "@nvisy/sdk/datatypes";
import { toast } from "vue-sonner";
import { OIDC_BRANDS } from "~/utils/oidcBrands";

const { t } = useI18n();
useHead({ title: () => t("auth.signup.title") });

definePageMeta({
	layout: "auth",
});

const { signupAsync, isSigningUp, signupError, startOidcSignIn } = useAuth();

// Desktop external-browser sign-in: when the desktop app opened this page in the
// system browser, it passed a `redirect_uri` deep link. After sign-up we mint a
// native-app token and hand it back on that link instead of entering the app
// here. On the plain web there's no `redirect_uri` and this is inert.
const { callbackFromRoute, tryDesktopHandoff } = useDesktopSignInReturn();

// Form state
const username = ref("");
const email = ref("");
const password = ref("");
const agreeToTerms = ref<boolean | "indeterminate">(false);
const showPassword = ref(false);
const termsError = ref(false);

// Username: lowercase alphanumeric with single internal dashes.
const USERNAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const usernameError = computed(() => {
	const value = username.value.trim();
	if (!value) return "";
	return USERNAME_PATTERN.test(value) ? "" : t("auth.signup.usernameError");
});

async function handleSignup(): Promise<void> {
	if (agreeToTerms.value !== true) {
		termsError.value = true;
		return;
	}
	termsError.value = false;

	if (usernameError.value) return;

	try {
		await signupAsync({
			username: username.value.trim(),
			emailAddress: email.value,
			password: password.value,
			rememberMe: true,
		});
	} catch {
		// A failed sign-up is surfaced via the mutation's error state.
		return;
	}
	// Desktop flow: hand the token back to the app and stop here (owns its own
	// error toast). Otherwise enter the app.
	if (await tryDesktopHandoff()) return;
	navigateTo("/");
}

// OIDC sign-up is the same flow as sign-in (the provider account either exists
// or is created). Return to the login page, which owns the `?signin=` return
// handler.
const oidcPending = ref<IdentityProvider | null>(null);

async function handleOidcSignIn(provider: IdentityProvider): Promise<void> {
	oidcPending.value = provider;
	try {
		const returnUrl = new URL("/auth/login", window.location.origin);
		// Carry the desktop deep link through the OIDC round-trip so the login
		// page's return handler can mint and hand off the token.
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

// The OIDC providers the server advertises, resolved to their brand (logo +
// label). A provider without a brand mapping is skipped.
const { hasOidc, oidcProviders } = useAuthCapabilities();
const oidcButtons = computed(() =>
	oidcProviders.value.flatMap((provider) => {
		const brand = OIDC_BRANDS[provider];
		return brand ? [{ provider, ...brand }] : [];
	}),
);
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="space-y-2 text-center">
      <h1 class="text-2xl font-semibold tracking-tight">{{ t("auth.signup.heading") }}</h1>
      <p class="text-sm text-muted-foreground">
        {{ t("auth.signup.subtitle") }}
      </p>
    </div>

    <template v-if="hasOidc">
      <!-- Social sign-up: one button per OIDC provider the server offers. -->
      <div class="flex gap-3">
        <Button
          v-for="btn in oidcButtons"
          :key="btn.provider"
          type="button"
          variant="outline"
          class="h-10 flex-1"
          :disabled="oidcPending !== null"
          @click="handleOidcSignIn(btn.provider)"
        >
          <Loader2
            v-if="oidcPending === btn.provider"
            class="mr-2 h-4 w-4 animate-spin"
          />
          <img v-else :src="btn.logo" :alt="t(btn.labelKey)" class="mr-2 h-4 w-4" />
          {{ t(btn.labelKey) }}
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
    </template>

    <!-- Form -->
    <form @submit.prevent="handleSignup" class="space-y-4">
      <!-- Username -->
      <div class="space-y-2">
        <Label for="username" required>{{ t("auth.signup.username") }}</Label>
        <Input
          id="username"
          name="username" data-testid="signup-username"
          v-model="username"
          type="text"
          :placeholder="t('auth.signup.usernamePlaceholder')"
          class="h-10"
          required
          autocapitalize="none"
          autocomplete="username"
          :aria-invalid="!!usernameError"
        />
        <p v-if="usernameError" class="text-sm text-destructive">
          {{ usernameError }}
        </p>
      </div>

      <!-- Email -->
      <div class="space-y-2">
        <Label for="email" required>{{ t("auth.shared.email") }}</Label>
        <Input
          id="email"
          name="email" data-testid="signup-email"
          v-model="email"
          type="email"
          :placeholder="t('auth.shared.emailPlaceholder')"
          class="h-10"
          required
          autocomplete="email"
        />
      </div>

      <!-- Password -->
      <div class="space-y-2">
        <Label for="password" required>{{ t("auth.shared.password") }}</Label>
        <div class="relative">
          <Input
            id="password"
            name="password" data-testid="signup-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="t('auth.signup.passwordPlaceholder')"
            class="h-10 pr-10"
            required
            autocomplete="new-password"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye v-if="!showPassword" :size="16" />
            <EyeOff v-else :size="16" />
          </button>
        </div>
      </div>

      <!-- Terms Agreement -->
      <div class="space-y-1">
        <div class="flex items-start gap-2">
          <Checkbox id="terms" data-testid="signup-terms" v-model="agreeToTerms" class="mt-0.5" />
          <Label
            for="terms"
            class="text-sm font-normal cursor-pointer leading-snug text-muted-foreground"
          >
            {{ t("auth.signup.agreePrefix") }}
            <a
              href="https://nvisy.com/legal/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-0.5 text-foreground hover:underline"
            >
              {{ t("auth.signup.terms") }}
              <ExternalLink :size="10" />
            </a>
            {{ t("auth.signup.and") }}
            <a
              href="https://nvisy.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-0.5 text-foreground hover:underline"
            >
              {{ t("auth.signup.privacyPolicy") }}
              <ExternalLink :size="10" />
            </a>
          </Label>
        </div>
        <p v-if="termsError" class="text-xs text-destructive pl-6">
          {{ t("auth.signup.termsError") }}
        </p>
      </div>

      <!-- Error Message -->
      <div
        v-if="signupError"
        class="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
      >
        <p>{{ signupError.message || t("auth.signup.genericError") }}</p>
      </div>

      <!-- Submit Button -->
      <Button type="submit" class="w-full h-10" data-testid="signup-submit" :disabled="isSigningUp">
        {{ isSigningUp ? t("auth.signup.submitting") : t("auth.signup.submit") }}
      </Button>
    </form>

    <!-- Login Link -->
    <p class="text-center text-sm text-muted-foreground">
      {{ t("auth.signup.hasAccount") }}
      <NuxtLink
        to="/auth/login"
        class="text-foreground hover:underline font-medium"
      >
        {{ t("auth.shared.signIn") }}
      </NuxtLink>
    </p>
  </div>
</template>
