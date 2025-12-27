<script setup lang="ts">
import { ref } from "vue";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

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

/**
 * Validate password strength
 */
function validatePassword(): boolean {
	passwordError.value = "";

	if (password.value.length < 8) {
		passwordError.value = "Password must be at least 8 characters";
		return false;
	}

	return true;
}

/**
 * Validate password confirmation
 */
function validateConfirmPassword(): boolean {
	confirmPasswordError.value = "";

	if (password.value !== confirmPassword.value) {
		confirmPasswordError.value = "Passwords do not match";
		return false;
	}

	return true;
}

/**
 * Handle reset password form submission
 */
async function handleResetPassword(): Promise<void> {
	// Validate both fields
	const isPasswordValid = validatePassword();
	const isConfirmPasswordValid = validateConfirmPassword();

	if (!isPasswordValid || !isConfirmPasswordValid) {
		return;
	}

	isLoading.value = true;

	try {
		// TODO: Implement actual reset password logic
		console.log("Resetting password with token:", token.value);
		console.log("New password:", password.value);

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));

		isSuccess.value = true;
	} catch (error) {
		console.error("Reset password error:", error);
	} finally {
		isLoading.value = false;
	}
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(): void {
	showPassword.value = !showPassword.value;
}

/**
 * Toggle confirm password visibility
 */
function toggleConfirmPasswordVisibility(): void {
	showConfirmPassword.value = !showConfirmPassword.value;
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1
        class="text-4xl md:text-5xl font-light leading-tight text-neutral-900 dark:text-white"
      >
        {{ isSuccess ? "Password reset successful" : "Create new password" }}
      </h1>
      <p
        class="text-lg md:text-xl leading-relaxed text-neutral-600 dark:text-neutral-400"
      >
        {{
          isSuccess
            ? "Your password has been updated"
            : "Choose a strong password for your account"
        }}
      </p>
    </div>

    <!-- Reset Password Card -->
    <Card class="border-neutral-200 dark:border-neutral-800">
      <CardHeader class="space-y-0 pb-4">
        <CardTitle class="text-2xl font-light text-neutral-900 dark:text-white">
          {{ isSuccess ? "All set!" : "Reset password" }}
        </CardTitle>
        <CardDescription
          class="text-base text-neutral-600 dark:text-neutral-400"
        >
          {{
            isSuccess
              ? "You can now sign in with your new password"
              : "Enter your new password below"
          }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Success Message -->
        <div v-if="isSuccess" class="space-y-4">
          <div class="flex justify-center mb-4">
            <div class="rounded-full bg-green-100 dark:bg-green-900 p-3">
              <CheckCircle
                :size="32"
                class="text-green-600 dark:text-green-400"
              />
            </div>
          </div>

          <div
            class="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
          >
            <p class="text-sm text-green-800 dark:text-green-200 text-center">
              Your password has been successfully reset. You can now sign in
              with your new password.
            </p>
          </div>

          <Button as-child class="w-full h-10">
            <NuxtLink to="/auth/login">
              Continue to login
              <ArrowRight :size="16" class="ml-2" />
            </NuxtLink>
          </Button>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleResetPassword" class="space-y-4">
          <!-- New Password -->
          <div class="space-y-2">
            <Label
              for="password"
              class="text-sm font-normal text-neutral-700 dark:text-neutral-300"
              >New password</Label
            >
            <div class="relative">
              <Lock
                :size="16"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <Input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Create a new password"
                class="pl-9 pr-9 h-10 border-neutral-300 dark:border-neutral-700"
                :class="{
                  'border-red-500 dark:border-red-500': passwordError,
                }"
                required
                @blur="validatePassword"
              />
              <button
                type="button"
                @click="togglePasswordVisibility"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                <Eye v-if="!showPassword" :size="16" />
                <EyeOff v-else :size="16" />
              </button>
            </div>
            <p
              v-if="passwordError"
              class="text-xs text-red-600 dark:text-red-400"
            >
              {{ passwordError }}
            </p>
            <p v-else class="text-xs text-neutral-500 dark:text-neutral-400">
              Must be at least 8 characters
            </p>
          </div>

          <!-- Confirm Password -->
          <div class="space-y-2">
            <Label
              for="confirmPassword"
              class="text-sm font-normal text-neutral-700 dark:text-neutral-300"
              >Confirm new password</Label
            >
            <div class="relative">
              <Lock
                :size="16"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <Input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm your new password"
                class="pl-9 pr-9 h-10 border-neutral-300 dark:border-neutral-700"
                :class="{
                  'border-red-500 dark:border-red-500': confirmPasswordError,
                }"
                required
                @blur="validateConfirmPassword"
              />
              <button
                type="button"
                @click="toggleConfirmPasswordVisibility"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                <Eye v-if="!showConfirmPassword" :size="16" />
                <EyeOff v-else :size="16" />
              </button>
            </div>
            <p
              v-if="confirmPasswordError"
              class="text-xs text-red-600 dark:text-red-400"
            >
              {{ confirmPasswordError }}
            </p>
          </div>

          <!-- Submit Button -->
          <Button type="submit" class="w-full h-10" :disabled="isLoading">
            <span
              v-if="!isLoading"
              class="flex items-center justify-center gap-2"
            >
              Reset password
              <ArrowRight :size="16" />
            </span>
            <span v-else>Resetting password...</span>
          </Button>

          <!-- Login Link -->
          <div class="text-center pt-2">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Remember your password?
              <NuxtLink
                to="/auth/login"
                class="font-medium text-neutral-900 dark:text-white hover:underline ml-1"
              >
                Log in
              </NuxtLink>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
