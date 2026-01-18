<template>
  <div class="flex flex-col h-full animate-in fade-in duration-200">
    <!-- Main content - centered -->
    <div class="flex-1 flex flex-col items-center justify-center">
      <!-- Logo -->
      <img
        src="~/assets/nvisy.png"
        alt="Nvisy"
        class="w-16 h-16 mb-4 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
      />

      <!-- Title -->
      <h1 class="text-lg font-medium mb-1">{{ $t('auth.title') }}</h1>
      <p class="text-xs text-muted-foreground mb-6">{{ $t('auth.description') }}</p>

      <!-- Form -->
      <div class="w-full max-w-[280px] space-y-3">
        <div class="space-y-1">
          <label class="text-sm text-muted-foreground">{{ $t('auth.baseUrl') }} <span class="text-xs">({{ $t('auth.optional') }})</span></label>
          <input
            v-model="baseUrl"
            type="url"
            placeholder="https://api.nvisy.com"
            class="w-full h-9 px-3 text-sm bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div class="space-y-1">
          <label class="text-sm">{{ $t('auth.apiToken') }} <span class="text-destructive">*</span></label>
          <input
            v-model="apiToken"
            type="password"
            :placeholder="$t('settings.apiTokenPlaceholder')"
            class="w-full h-9 px-3 text-sm bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            @keyup.enter="connect"
          />
          <a
            href="https://app.nvisy.com/settings/api"
            target="_blank"
            class="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            {{ $t('auth.getToken') }}
            <ExternalLink class="w-3 h-3" />
          </a>
        </div>

        <Button
          class="w-full h-9 mt-2"
          :disabled="!canConnect || isConnecting"
          @click="connect"
        >
          <Loader2 v-if="isConnecting" class="w-4 h-4 mr-2 animate-spin" />
          {{ isConnecting ? $t('auth.connecting') : $t('auth.connect') }}
        </Button>

        <!-- Error message -->
        <p v-if="error" class="text-xs text-destructive text-center">
          {{ error }}
        </p>
      </div>
    </div>

    <!-- Bottom settings -->
    <div class="flex items-center justify-between pt-4">
      <ThemeToggle />
      <LanguageSwitcher />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExternalLink, Loader2 } from "lucide-vue-next";
import { Button } from "~/components/ui/button";

const emit = defineEmits<{
	authenticated: [baseUrl: string, apiToken: string];
}>();

const baseUrl = ref("");
const apiToken = ref("");
const isConnecting = ref(false);
const error = ref("");

const DEFAULT_BASE_URL = "https://api.nvisy.com";

const canConnect = computed(() => {
	return apiToken.value.trim() !== "";
});

const connect = async () => {
	if (!canConnect.value || isConnecting.value) return;

	isConnecting.value = true;
	error.value = "";

	try {
		// TODO: Implement actual API validation
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Use default base URL if not provided
		const finalBaseUrl = baseUrl.value.trim() || DEFAULT_BASE_URL;

		// Emit authenticated event
		emit("authenticated", finalBaseUrl, apiToken.value);
	} catch (_e) {
		error.value = "Failed to connect. Please check your credentials.";
	} finally {
		isConnecting.value = false;
	}
};
</script>
