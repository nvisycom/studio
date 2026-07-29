<script setup lang="ts">
import { ref, computed } from "vue";
import { Eye, EyeOff, ExternalLink } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Checkbox } from "#console/components/ui/checkbox";
import { NvisyApiError } from "@nvisy/sdk";

useHead({ title: "Sign Up" });

definePageMeta({
	layout: "auth",
});

const { signupAsync, isSigningUp, signupError } = useAuth();

const apiError = computed(() =>
	signupError.value instanceof NvisyApiError ? signupError.value : null,
);

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
	return USERNAME_PATTERN.test(value)
		? ""
		: "Use lowercase letters, numbers, and single dashes between characters.";
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
		navigateTo("/");
	} catch {
		// Error is handled by the mutation
	}
}

async function handleGoogleSignup(): Promise<void> {
	// TODO: Implement Google OAuth
}

async function handleMicrosoftSignup(): Promise<void> {
	// TODO: Implement Microsoft OAuth
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="space-y-2 text-center">
      <h1 class="text-2xl font-semibold tracking-tight">Create an account</h1>
      <p class="text-sm text-muted-foreground">
        Get started with your free account
      </p>
    </div>

    <!-- Social Signup Buttons -->
    <div class="grid grid-cols-2 gap-3">
      <Button
        type="button"
        variant="outline"
        @click="handleGoogleSignup"
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
        @click="handleMicrosoftSignup"
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
    <form @submit.prevent="handleSignup" class="space-y-4">
      <!-- Username -->
      <div class="space-y-2">
        <Label for="username">Username</Label>
        <Input
          id="username"
          v-model="username"
          type="text"
          placeholder="john-doe"
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
        <Label for="password">Password</Label>
        <div class="relative">
          <Input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Create a password"
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
          <Checkbox id="terms" v-model="agreeToTerms" class="mt-0.5" />
          <Label
            for="terms"
            class="text-sm font-normal cursor-pointer leading-snug text-muted-foreground"
          >
            I agree to the
            <a
              href="https://nvisy.com/legal/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-0.5 text-foreground hover:underline"
            >
              Terms
              <ExternalLink :size="10" />
            </a>
            and
            <a
              href="https://nvisy.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-0.5 text-foreground hover:underline"
            >
              Privacy Policy
              <ExternalLink :size="10" />
            </a>
          </Label>
        </div>
        <p v-if="termsError" class="text-xs text-destructive pl-6">
          You must agree to the terms to continue
        </p>
      </div>

      <!-- Error Message -->
      <div
        v-if="signupError"
        class="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
      >
        <p>{{ signupError.message || "An error occurred during signup" }}</p>
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
      <Button type="submit" class="w-full h-10" :disabled="isSigningUp">
        {{ isSigningUp ? "Creating account..." : "Create account" }}
      </Button>
    </form>

    <!-- Login Link -->
    <p class="text-center text-sm text-muted-foreground">
      Already have an account?
      <NuxtLink
        to="/auth/login"
        class="text-foreground hover:underline font-medium"
      >
        Sign in
      </NuxtLink>
    </p>
  </div>
</template>
