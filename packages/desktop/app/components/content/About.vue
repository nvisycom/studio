<template>
  <div class="flex flex-col h-full animate-in fade-in duration-200">
    <!-- Main content -->
    <div class="flex-1 space-y-4">
      <!-- Logo, Name, and Version -->
      <div class="flex flex-col items-center space-y-2 py-2">
        <img
          src="~/assets/nvisy.png"
          alt="Nvisy"
          class="w-12 h-12 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
        />
        <div class="text-center">
          <h1 class="text-sm font-medium">Nvisy Desktop</h1>
          <div class="flex items-center justify-center gap-1 mt-0.5">
            <span class="text-xs text-muted-foreground">v{{ appVersion }}</span>
            <Button variant="ghost" size="sm" class="h-5 w-5 p-0" @click="copyAllInfo">
              <Check v-if="copied" class="w-3 h-3 text-green-500" />
              <Copy v-else class="w-3 h-3 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      <!-- Build Info -->
      <div class="space-y-1">
        <div class="flex items-center justify-between py-1">
          <span class="text-sm">{{ $t('about.build') }}</span>
          <span class="text-xs text-muted-foreground">{{ buildNumber }}</span>
        </div>
        <div class="flex items-center justify-between py-1">
          <span class="text-sm">{{ $t('about.tauri') }}</span>
          <span class="text-xs text-muted-foreground">{{ tauriVersion }}</span>
        </div>
        <div class="flex items-center justify-between py-1">
          <span class="text-sm">{{ $t('about.platform') }}</span>
          <span class="text-xs text-muted-foreground">{{ platform }}</span>
        </div>
      </div>

      <!-- Links -->
      <div class="space-y-1">
        <Button variant="ghost" size="sm" class="w-full justify-between h-8 text-xs">
          <span>{{ $t('about.website') }}</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" class="w-full justify-between h-8 text-xs">
          <span>{{ $t('about.changelog') }}</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" class="w-full justify-between h-8 text-xs">
          <span>{{ $t('about.github') }}</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>

    <!-- Footer - pinned to bottom -->
    <div class="mt-auto pt-4">
      <p class="text-[10px] text-center text-muted-foreground">
        © {{ currentYear }} Nvisy. {{ $t('about.rights') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExternalLink, Copy, Check } from "lucide-vue-next";
import { Button } from "~/components/ui/button";

const currentYear = new Date().getFullYear();
const copied = ref(false);

// App info
const appVersion = '0.1.0';
const buildNumber = '#1234';
const tauriVersion = '2.0.0';
const platform = 'macOS';

const copyAllInfo = async () => {
  const info = `Nvisy Desktop/${appVersion} (${platform}; Tauri/${tauriVersion}; Build ${buildNumber})`;

  try {
    await navigator.clipboard.writeText(info);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy info:', err);
  }
};
</script>
