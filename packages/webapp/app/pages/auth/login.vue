<script setup lang="ts">
import { ref } from "vue";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-vue-next";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

definePageMeta({
	layout: "auth",
});

// Form state
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);
const isLoading = ref(false);

/**
 * Handle login form submission
 */
async function handleLogin(): Promise<void> {
	isLoading.value = true;

	try {
		// TODO: Implement actual login logic
		console.log("Logging in with:", {
			email: email.value,
			password: password.value,
			rememberMe: rememberMe.value,
		});

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Redirect to dashboard
		navigateTo("/");
	} catch (error) {
		console.error("Login error:", error);
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
 * Handle Google login
 */
async function handleGoogleLogin(): Promise<void> {
	console.log("Google login");
	// TODO: Implement Google OAuth
}

/**
 * Handle Microsoft login
 */
async function handleMicrosoftLogin(): Promise<void> {
	console.log("Microsoft login");
	// TODO: Implement Microsoft OAuth
}
</script>

<template>
  <div class="min-h-[calc(100vh-57px)] flex">
    <!-- Left Side: Gradient -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-neutral-900 via-neutral-800 to-white dark:from-black dark:via-neutral-900 dark:to-neutral-800" />

    <!-- Right Side: Form -->
    <div class="flex-1 flex items-center justify-center p-6 bg-neutral-50 dark:bg-neutral-950">
      <div class="w-full max-w-[480px]">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
            Welcome back
          </h1>
          <p class="text-neutral-600 dark:text-neutral-400">
            Sign in to your account to continue
          </p>
        </div>

        <!-- Login Card -->
        <Card class="border-neutral-200 dark:border-neutral-800">
          <CardHeader class="space-y-1 pb-4">
            <CardTitle class="text-xl font-semibold">Sign in</CardTitle>
            <CardDescription>Enter your email and password</CardDescription>
          </CardHeader>
          <CardContent>
            <form @submit.prevent="handleLogin" class="space-y-4">
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

              <!-- Password -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <Label for="password" class="text-sm font-medium">Password</Label>
                  <NuxtLink
                    to="/auth/forgot-password"
                    class="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                  >
                    Forgot password?
                  </NuxtLink>
                </div>
                <div class="relative">
                  <Lock :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Enter your password"
                    class="pl-9 pr-9 h-10 border-neutral-300 dark:border-neutral-700"
                    required
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
              </div>

              <!-- Remember Me -->
              <div class="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  v-model:checked="rememberMe"
                  class="border-neutral-400 dark:border-neutral-600"
                />
                <Label for="remember" class="text-sm font-normal cursor-pointer text-neutral-600 dark:text-neutral-400">
                  Keep me signed in
                </Label>
              </div>

              <!-- Submit Button -->
              <Button type="submit" class="w-full h-10" :disabled="isLoading">
                <span v-if="!isLoading" class="flex items-center justify-center gap-2">
                  Sign in
                  <ArrowRight :size="16" />
                </span>
                <span v-else>Signing in...</span>
              </Button>

              <!-- Divider -->
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div class="relative flex justify-center text-xs">
                  <span class="bg-white dark:bg-neutral-950 px-2 text-neutral-500 dark:text-neutral-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <!-- Social Login Buttons -->
              <div class="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  @click="handleGoogleLogin"
                  class="w-full border-neutral-300 dark:border-neutral-700"
                >
                  <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  @click="handleMicrosoftLogin"
                  class="w-full border-neutral-300 dark:border-neutral-700"
                >
                  <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#f25022" d="M1 1h10v10H1z"/>
                    <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                    <path fill="#7fba00" d="M1 13h10v10H1z"/>
                    <path fill="#ffb900" d="M13 13h10v10H13z"/>
                  </svg>
                  Microsoft
                </Button>
              </div>

              <!-- Sign Up Link -->
              <div class="text-center pt-2">
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  Don't have an account?
                  <NuxtLink
                    to="/auth/signup"
                    class="font-medium text-neutral-900 dark:text-white hover:underline ml-1"
                  >
                    Sign up
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
