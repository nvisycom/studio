<script setup lang="ts">
import { ref } from "vue";
import { Eye, EyeOff, CheckCircle } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";

useHead({ title: "Reset Password" });

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
		passwordError.value = "Password must be at least 8 characters";
		return false;
	}
	return true;
}

function validateConfirmPassword(): boolean {
	confirmPasswordError.value = "";
	if (password.value !== confirmPassword.value) {
		confirmPasswordError.value = "Passwords do not match";
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
        <h1 class="text-2xl font-semibold tracking-tight">Password reset</h1>
        <p class="text-sm text-muted-foreground">
          Your password has been successfully updated
        </p>
      </div>

      <Button as-child class="w-full h-10">
        <NuxtLink to="/auth/login"> Continue to login </NuxtLink>
      </Button>
    </template>

    <!-- Form State -->
    <template v-else>
      <!-- Header -->
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight">Set new password</h1>
        <p class="text-sm text-muted-foreground">
          Choose a strong password for your account
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleResetPassword" class="space-y-4">
        <!-- New Password -->
        <div class="space-y-2">
          <Label for="password">New password</Label>
          <div class="relative">
            <Input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter new password"
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
            Must be at least 8 characters
          </p>
        </div>

        <!-- Confirm Password -->
        <div class="space-y-2">
          <Label for="confirmPassword">Confirm password</Label>
          <div class="relative">
            <Input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Confirm new password"
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
          {{ isLoading ? "Resetting..." : "Reset password" }}
        </Button>
      </form>

      <!-- Login Link -->
      <p class="text-center text-sm text-muted-foreground">
        Remember your password?
        <NuxtLink
          to="/auth/login"
          class="text-foreground hover:underline font-medium"
        >
          Sign in
        </NuxtLink>
      </p>
    </template>
  </div>
</template>
