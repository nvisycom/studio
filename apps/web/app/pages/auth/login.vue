<script setup lang="ts">
import { Eye, EyeOff } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Checkbox } from "#console/components/ui/checkbox";
import { FeatureGate } from "#console/components/common";
import { NvisyApiError } from "@nvisy/sdk";

const { t } = useI18n();

useHead({ title: t("auth.login.title") });

definePageMeta({
	layout: "auth",
});

const { loginAsync, isLoggingIn, loginError } = useAuth();

const apiError = computed(() =>
	loginError.value instanceof NvisyApiError ? loginError.value : null,
);

// Form state
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
		// Error is handled by the mutation
	}
}

async function handleGoogleLogin(): Promise<void> {
	// TODO: Implement Google OAuth
}

async function handleMicrosoftLogin(): Promise<void> {
	// TODO: Implement Microsoft OAuth
}
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
          @click="handleGoogleLogin"
          class="h-10"
        >
          <img
            src="~/assets/brands/google.png"
            :alt="t('auth.shared.google')"
            class="w-4 h-4 mr-2"
          />
          {{ t("auth.shared.google") }}
        </Button>
        <Button
          type="button"
          variant="outline"
          @click="handleMicrosoftLogin"
          class="h-10"
        >
          <img
            src="~/assets/brands/microsoft.png"
            :alt="t('auth.shared.microsoft')"
            class="w-4 h-4 mr-2"
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
      <!-- Email -->
      <div class="space-y-2">
        <Label for="email">{{ t("auth.shared.email") }}</Label>
        <Input
          id="email"
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
        <div class="flex items-center justify-between">
          <Label for="password">{{ t("auth.shared.password") }}</Label>
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
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="t('auth.login.passwordPlaceholder')"
            class="h-10 pr-10"
            required
            autocomplete="current-password"
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
