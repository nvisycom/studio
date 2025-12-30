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

const { loginAsync, isLoggingIn, loginError } = useAuth();

// Form state
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const showPassword = ref(false);

/**
 * Handle login form submission
 */
async function handleLogin(): Promise<void> {
  try {
    await loginAsync({
      emailAddress: email.value,
      password: password.value,
      rememberMe: rememberMe.value,
    });

    // Redirect to dashboard
    navigateTo("/");
  } catch (error) {
    console.error("Login error:", error);
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
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1
        class="text-4xl md:text-5xl font-light leading-tight text-neutral-900 dark:text-white"
      >
        Welcome back
      </h1>
      <p
        class="text-lg md:text-xl leading-relaxed text-neutral-600 dark:text-neutral-400"
      >
        Sign in to your account to continue
      </p>
    </div>

    <!-- Login Card -->
    <Card class="border-neutral-200 dark:border-neutral-800">
      <CardHeader class="space-y-0 pb-4">
        <CardTitle class="text-2xl font-light text-neutral-900 dark:text-white"
          >Sign in</CardTitle
        >
        <CardDescription
          class="text-base text-neutral-600 dark:text-neutral-400"
          >Enter your email and password</CardDescription
        >
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Email -->
          <div class="space-y-2">
            <Label
              for="email"
              class="text-sm font-normal text-neutral-700 dark:text-neutral-300"
              >Email address</Label
            >
            <div class="relative">
              <Mail
                :size="16"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
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
              <Label
                for="password"
                class="text-sm font-normal text-neutral-700 dark:text-neutral-300"
                >Password</Label
              >
              <NuxtLink
                to="/auth/forgot-password"
                class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Forgot password?
              </NuxtLink>
            </div>
            <div class="relative">
              <Lock
                :size="16"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
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
            <Label
              for="remember"
              class="text-sm font-light cursor-pointer text-neutral-600 dark:text-neutral-400"
            >
              Keep me signed in
            </Label>
          </div>

          <!-- Error Message -->
          <div
            v-if="loginError"
            class="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-md"
          >
            <p>{{ loginError.message || "An error occurred during login" }}</p>
            <p
              v-if="loginError.suggestion"
              class="mt-1 text-red-500 dark:text-red-300"
            >
              {{ loginError.suggestion }}
            </p>
            <ul
              v-if="loginError.validation?.length"
              class="mt-2 list-disc list-inside space-y-1"
            >
              <li v-for="err in loginError.validation" :key="err.field">
                <span class="font-medium">{{ err.field }}:</span>
                {{ err.message }}
              </li>
            </ul>
          </div>

          <!-- Submit Button -->
          <Button type="submit" class="w-full h-10" :disabled="isLoggingIn">
            <span
              v-if="!isLoggingIn"
              class="flex items-center justify-center gap-2"
            >
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
            <div class="relative flex justify-center text-sm">
              <span
                class="bg-white dark:bg-neutral-950 px-2 text-neutral-600 dark:text-neutral-400 font-light"
              >
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
              <img
                src="~/assets/brands/google.png"
                alt="Google"
                class="w-4 h-4 mr-2"
              />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              @click="handleMicrosoftLogin"
              class="w-full border-neutral-300 dark:border-neutral-700"
            >
              <img
                src="~/assets/brands/microsoft.png"
                alt="Microsoft"
                class="w-4 h-4 mr-2"
              />
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
</template>
