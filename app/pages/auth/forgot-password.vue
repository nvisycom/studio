<script setup lang="ts">
import { ref } from "vue";
import { ArrowLeft, CheckCircle } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

useHead({ title: "Forgot Password" });

definePageMeta({
	layout: "auth",
});

// Form state
const email = ref("");
const isLoading = ref(false);
const isSubmitted = ref(false);

async function handleForgotPassword(): Promise<void> {
	isLoading.value = true;

	try {
		// TODO: Implement actual forgot password logic
		await new Promise((resolve) => setTimeout(resolve, 1000));
		isSubmitted.value = true;
	} catch {
		// TODO: Handle error
	} finally {
		isLoading.value = false;
	}
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back Link -->
    <NuxtLink
      to="/auth/login"
      class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft :size="14" />
      Back to login
    </NuxtLink>

    <!-- Success State -->
    <template v-if="isSubmitted">
      <div class="space-y-2 text-center">
        <div class="flex justify-center mb-4">
          <div
            class="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center"
          >
            <CheckCircle :size="24" class="text-emerald-500" />
          </div>
        </div>
        <h1 class="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p class="text-sm text-muted-foreground">
          We sent a password reset link to<br />
          <span class="text-foreground font-medium">{{ email }}</span>
        </p>
      </div>

      <div class="space-y-3">
        <Button as-child class="w-full h-10">
          <NuxtLink to="/auth/login"> Back to login </NuxtLink>
        </Button>

        <p class="text-center text-xs text-muted-foreground">
          Didn't receive the email?
          <button
            @click="isSubmitted = false"
            class="text-foreground hover:underline font-medium"
          >
            Try again
          </button>
        </p>
      </div>
    </template>

    <!-- Form State -->
    <template v-else>
      <!-- Header -->
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold tracking-tight">Forgot password?</h1>
        <p class="text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleForgotPassword" class="space-y-4">
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

        <Button type="submit" class="w-full h-10" :disabled="isLoading">
          {{ isLoading ? "Sending..." : "Send reset link" }}
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
