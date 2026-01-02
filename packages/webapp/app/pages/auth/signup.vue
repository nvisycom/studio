<script setup lang="ts">
import { ref } from "vue";
import {
	Mail,
	Lock,
	Eye,
	EyeOff,
	ArrowRight,
	ExternalLink,
	User,
} from "lucide-vue-next";
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

const { signupAsync, isSigningUp, signupError } = useAuth();

// Form state
const displayName = ref("");
const email = ref("");
const password = ref("");
const agreeToTerms = ref<boolean | "indeterminate">(false);
const showPassword = ref(false);
const termsError = ref(false);

/**
 * Handle signup form submission
 */
async function handleSignup(): Promise<void> {
	if (agreeToTerms.value !== true) {
		termsError.value = true;
		return;
	}
	termsError.value = false;

	try {
		await signupAsync({
			displayName: displayName.value,
			emailAddress: email.value,
			password: password.value,
			rememberMe: true,
		});

		// Redirect to dashboard or onboarding
		navigateTo("/");
	} catch {
		// Error is handled by the mutation
	}
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(): void {
	showPassword.value = !showPassword.value;
}

/**
 * Handle Google signup
 */
async function handleGoogleSignup(): Promise<void> {
	// TODO: Implement Google OAuth
}

/**
 * Handle Microsoft signup
 */
async function handleMicrosoftSignup(): Promise<void> {
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
        Create an account
      </h1>
      <p
        class="text-lg md:text-xl leading-relaxed text-neutral-600 dark:text-neutral-400"
      >
        Get started with your free account
      </p>
    </div>

    <!-- Signup Card -->
    <Card class="border-neutral-200 dark:border-neutral-800">
      <CardHeader class="space-y-0 pb-4">
        <CardTitle class="text-2xl font-light text-neutral-900 dark:text-white"
          >Sign up</CardTitle
        >
        <CardDescription
          class="text-base text-neutral-600 dark:text-neutral-400"
          >Create your account to get started</CardDescription
        >
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSignup" class="space-y-4">
          <!-- Display Name -->
          <div class="space-y-2">
            <Label
              for="displayName"
              class="text-sm font-normal text-neutral-700 dark:text-neutral-300"
              >Full name</Label
            >
            <div class="relative">
              <User
                :size="16"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <Input
                id="displayName"
                v-model="displayName"
                type="text"
                placeholder="John Doe"
                class="pl-9 h-10 border-neutral-300 dark:border-neutral-700"
                required
              />
            </div>
          </div>

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
            <Label
              for="password"
              class="text-sm font-normal text-neutral-700 dark:text-neutral-300"
              >Password</Label
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
                placeholder="Create a password"
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

          <!-- Terms Agreement -->
          <div class="space-y-1">
            <div class="flex items-start gap-2">
              <Checkbox
                id="terms"
                v-model="agreeToTerms"
                class="mt-0.5 border-neutral-400 dark:border-neutral-600"
              />
              <Label
                for="terms"
                class="text-sm font-light cursor-pointer leading-tight text-neutral-600 dark:text-neutral-400"
              >
                I agree to the
                <a
                  href="https://nvisy.com/legal/terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-neutral-900 dark:text-white hover:underline"
                >
                  Terms of Service
                  <ExternalLink :size="10" />
                </a>
                and
                <a
                  href="https://nvisy.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 text-neutral-900 dark:text-white hover:underline"
                >
                  Privacy Policy
                  <ExternalLink :size="10" />
                </a>
              </Label>
            </div>
            <p v-if="termsError" class="text-sm text-red-600 dark:text-red-400">
              You must agree to the terms to continue
            </p>
          </div>

          <!-- Error Message -->
          <div
            v-if="signupError"
            class="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-md"
          >
            <p>
              {{ signupError.message || "An error occurred during signup" }}
            </p>
            <p
              v-if="signupError.suggestion"
              class="mt-1 text-red-500 dark:text-red-300"
            >
              {{ signupError.suggestion }}
            </p>
            <ul
              v-if="signupError.validation?.length"
              class="mt-2 list-disc list-inside space-y-1"
            >
              <li v-for="err in signupError.validation" :key="err.field">
                <span class="font-medium">{{ err.field }}:</span>
                {{ err.message }}
              </li>
            </ul>
          </div>

          <!-- Submit Button -->
          <Button type="submit" class="w-full h-10" :disabled="isSigningUp">
            <span
              v-if="!isSigningUp"
              class="flex items-center justify-center gap-2"
            >
              Create account
              <ArrowRight :size="16" />
            </span>
            <span v-else>Creating account...</span>
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

          <!-- Social Signup Buttons -->
          <div class="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              @click="handleGoogleSignup"
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
              @click="handleMicrosoftSignup"
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

          <!-- Login Link -->
          <div class="text-center pt-2">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Already have an account?
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
