<script setup lang="ts">
import { Eye, EyeOff, CheckCircle } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";

const { t } = useI18n();

useHead({ title: () => t("auth.resetPassword.title") });

definePageMeta({
	layout: "auth",
});

// Get token from URL query params
const route = useRoute();
const token = ref((route.query.token as string) || "");

// Form state
const password = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const isSuccess = ref(false);

// Validation errors
const passwordError = ref("");
const confirmPasswordError = ref("");

function validatePassword(): boolean {
	passwordError.value = "";
	if (password.value.length < 8) {
		passwordError.value = t("auth.resetPassword.passwordTooShort");
		return false;
	}
	return true;
}

function validateConfirmPassword(): boolean {
	confirmPasswordError.value = "";
	if (password.value !== confirmPassword.value) {
		confirmPasswordError.value = t("auth.resetPassword.passwordsDontMatch");
		return false;
	}
	return true;
}

async function handleResetPassword(): Promise<void> {
	const isPasswordValid = validatePassword();
	const isConfirmPasswordValid = validateConfirmPassword();

	if (!isPasswordValid || !isConfirmPasswordValid) {
		return;
	}

	isLoading.value = true;

	try {
		// TODO: Implement actual reset password logic
		await new Promise((resolve) => setTimeout(resolve, 1000));
		isSuccess.value = true;
	} catch {
		// TODO: Handle error
	} finally {
		isLoading.value = false;
	}
}
</script>

<template>
  <div class="space-y-6">
    <!-- Success State -->
    <template v-if="isSuccess">
      <div class="space-y-2 text-center">
        <div class="flex justify-center mb-4">
          <div
            class="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center"
          >
            <CheckCircle :size="24" class="text-emerald-500" />
          </div>
        </div>
        <h1 class="text-2xl font-semibold tracking-tight">{{ t("auth.resetPassword.successHeading") }}</h1>
        <p class="text-sm text-muted-foreground">
          {{ t("auth.resetPassword.successSubtitle") }}
        </p>
      </div>

      <Button as-child class="w-full h-10">
        <NuxtLink to="/auth/login"> {{ t("auth.resetPassword.continueToLogin") }} </NuxtLink>
      </Button>
    </template>

    <!-- Form State -->
    <template v-else>
      <!-- Header -->
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight">{{ t("auth.resetPassword.heading") }}</h1>
        <p class="text-sm text-muted-foreground">
          {{ t("auth.resetPassword.subtitle") }}
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleResetPassword" class="space-y-4">
        <!-- New Password -->
        <div class="space-y-2">
          <Label for="password" required>{{ t("auth.resetPassword.newPassword") }}</Label>
          <div class="relative">
            <Input
              id="password"
              name="new-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="t('auth.resetPassword.newPasswordPlaceholder')"
              class="h-10 pr-10"
              :class="{ 'border-destructive': passwordError }"
              required
              autocomplete="new-password"
              @blur="validatePassword"
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
          <p v-if="passwordError" class="text-xs text-destructive">
            {{ passwordError }}
          </p>
          <p v-else class="text-xs text-muted-foreground">
            {{ t("auth.resetPassword.passwordHint") }}
          </p>
        </div>

        <!-- Confirm Password -->
        <div class="space-y-2">
          <Label for="confirmPassword" required>{{ t("auth.resetPassword.confirmPassword") }}</Label>
          <div class="relative">
            <Input
              id="confirmPassword"
              name="confirm-password"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              :placeholder="t('auth.resetPassword.confirmPasswordPlaceholder')"
              class="h-10 pr-10"
              :class="{ 'border-destructive': confirmPasswordError }"
              required
              autocomplete="new-password"
              @blur="validateConfirmPassword"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eye v-if="!showConfirmPassword" :size="16" />
              <EyeOff v-else :size="16" />
            </button>
          </div>
          <p v-if="confirmPasswordError" class="text-xs text-destructive">
            {{ confirmPasswordError }}
          </p>
        </div>

        <Button type="submit" class="w-full h-10" :disabled="isLoading">
          {{ isLoading ? t("auth.resetPassword.submitting") : t("auth.resetPassword.submit") }}
        </Button>
      </form>

      <!-- Login Link -->
      <p class="text-center text-sm text-muted-foreground">
        {{ t("auth.resetPassword.rememberPassword") }}
        <NuxtLink
          to="/auth/login"
          class="text-foreground hover:underline font-medium"
        >
          {{ t("auth.shared.signIn") }}
        </NuxtLink>
      </p>
    </template>
  </div>
</template>
