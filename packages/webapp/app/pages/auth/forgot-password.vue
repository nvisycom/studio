<script setup lang="ts">
import { ref } from "vue";
import { Mail, ArrowRight, ArrowLeft } from "lucide-vue-next";
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

// Form state
const email = ref("");
const isLoading = ref(false);
const isSubmitted = ref(false);

/**
 * Handle forgot password form submission
 */
async function handleForgotPassword(): Promise<void> {
	isLoading.value = true;

	try {
		// TODO: Implement actual forgot password logic
		console.log("Sending reset email to:", email.value);

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));

		isSubmitted.value = true;
	} catch (error) {
		console.error("Forgot password error:", error);
	} finally {
		isLoading.value = false;
	}
}
</script>

<template>
  <div class="min-h-[calc(100vh-57px)] flex">
    <!-- Left Side: Gradient -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-neutral-900 via-neutral-800 to-white dark:from-black dark:via-neutral-900 dark:to-neutral-800" />

    <!-- Right Side: Form -->
    <div class="flex-1 flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-950">
      <div class="w-full max-w-[480px]">
        <!-- Back to Login -->
        <Button variant="ghost" as-child class="mb-4 -ml-2">
          <NuxtLink to="/auth/login" class="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100">
            <ArrowLeft :size="16" class="mr-2" />
            Back to login
          </NuxtLink>
        </Button>

        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
            Reset your password
          </h1>
          <p class="text-neutral-600 dark:text-neutral-400">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <!-- Forgot Password Card -->
        <Card class="border-neutral-200 dark:border-neutral-800">
          <CardHeader class="space-y-1 pb-4">
            <CardTitle class="text-xl font-semibold">
              {{ isSubmitted ? "Check your email" : "Forgot password" }}
            </CardTitle>
            <CardDescription>
              {{ isSubmitted ? "We've sent you a password reset link" : "We'll email you a reset link" }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <!-- Success Message -->
            <div v-if="isSubmitted" class="space-y-4">
              <div class="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <p class="text-sm text-green-800 dark:text-green-200">
                  We've sent a password reset link to <strong>{{ email }}</strong>.
                  Please check your inbox and follow the instructions.
                </p>
              </div>

              <div class="text-sm text-neutral-600 dark:text-neutral-400">
                <p>Didn't receive the email? Check your spam folder or
                  <button
                    @click="isSubmitted = false"
                    class="text-neutral-900 dark:text-white hover:underline font-medium"
                  >
                    try again
                  </button>
                </p>
              </div>

              <Button as-child class="w-full h-10">
                <NuxtLink to="/auth/login">
                  <ArrowLeft :size="16" class="mr-2" />
                  Back to login
                </NuxtLink>
              </Button>
            </div>

            <!-- Form -->
            <form v-else @submit.prevent="handleForgotPassword" class="space-y-4">
              <!-- Email -->
              <div class="space-y-2">
                <Label for="email" class="text-sm font-medium">Email address</Label>
                <div class="relative">
                  <Mail :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="email"
                    v-model="email"
                    type="email"
                    placeholder="name@company.com"
                    class="pl-9 h-10 border-neutral-300 dark:border-neutral-700"
                    required
                  />
                </div>
              </div>

              <!-- Submit Button -->
              <Button type="submit" class="w-full h-10" :disabled="isLoading">
                <span v-if="!isLoading" class="flex items-center justify-center gap-2">
                  Send reset link
                  <ArrowRight :size="16" />
                </span>
                <span v-else>Sending...</span>
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
    </div>
  </div>
</template>
