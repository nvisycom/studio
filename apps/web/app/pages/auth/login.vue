<script setup lang="ts">
import { ref, computed } from "vue";
import { Eye, EyeOff } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Checkbox } from "#console/components/ui/checkbox";
import { NvisyApiError } from "@nvisy/sdk";

useHead({ title: "Sign In" });

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
      <h1 class="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p class="text-sm text-muted-foreground">
        Sign in to your account to continue
      </p>
    </div>

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
          alt="Google"
          class="w-4 h-4 mr-2"
        />
        Google
      </Button>
      <Button
        type="button"
        variant="outline"
        @click="handleMicrosoftLogin"
        class="h-10"
      >
        <img
          src="~/assets/brands/microsoft.png"
          alt="Microsoft"
          class="w-4 h-4 mr-2"
        />
        Microsoft
      </Button>
    </div>

    <!-- Divider -->
    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-border" />
      </div>
      <div class="relative flex justify-center text-xs uppercase">
        <span class="bg-background px-2 text-muted-foreground">
          or continue with email
        </span>
      </div>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleLogin" class="space-y-4">
      <!-- Email -->
      <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input
          id="email"
          v-model="email"
          type="email"
          placeholder="name@example.com"
          class="h-10"
          required
          autocomplete="email"
        />
      </div>

      <!-- Password -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label for="password">Password</Label>
          <NuxtLink
            to="/auth/forgot-password"
            class="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot password?
          </NuxtLink>
        </div>
        <div class="relative">
          <Input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter your password"
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
          Keep me signed in
        </Label>
      </div>

      <!-- Error Message -->
      <div
        v-if="loginError"
        class="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
      >
        <p>{{ loginError.message || "An error occurred during login" }}</p>
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
        {{ isLoggingIn ? "Signing in..." : "Sign in" }}
      </Button>
    </form>

    <!-- Sign Up Link -->
    <p class="text-center text-sm text-muted-foreground">
      Don't have an account?
      <NuxtLink
        to="/auth/signup"
        class="text-foreground hover:underline font-medium"
      >
        Sign up
      </NuxtLink>
    </p>
  </div>
</template>
