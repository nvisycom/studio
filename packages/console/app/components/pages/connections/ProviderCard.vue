<script setup lang="ts">
import { ExternalLink } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Card,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";

const { t } = useI18n();

/**
 * Provider data structure (a third-party service that can be connected)
 */
interface Provider {
	id: string | number;
	name: string;
	description: string;
	shortDescription?: string;
	icon: string;
	status: "available" | "unavailable";
	tags?: string[];
	isNew?: boolean;
	isPopular?: boolean;
	isExternal?: boolean;
	externalUrl?: string;
}

/**
 * Component props interface
 */
interface Props {
	provider: Provider;
}

/**
 * Component emits interface
 */
interface Emits {
	(e: "connect", id: string | number): void;
	(e: "notifyMe", id: string | number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Extract website domain from URL (e.g., "https://www.npmjs.com/package/..." -> "Npmjs.com")
 */
function getWebsiteName(url?: string): string {
	if (!url) return "";
	try {
		const hostname = new URL(url).hostname;
		// Remove www. prefix and capitalize first letter
		const domain = hostname.replace(/^www\./, "");
		return domain.charAt(0).toUpperCase() + domain.slice(1);
	} catch {
		return "";
	}
}

const websiteName = computed(() => getWebsiteName(props.provider.externalUrl));
</script>

<template>
  <Card
    :class="[
      'overflow-hidden border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-200',
      provider.status === 'unavailable'
        ? 'opacity-50 hover:opacity-70'
        : 'hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md hover:scale-[1.02]',
    ]"
  >
    <CardHeader class="pb-2">
      <!-- Icon and Name Row -->
      <div class="flex items-center gap-3">
        <div
          :class="[
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-neutral-100 dark:bg-neutral-800',
            provider.status === 'unavailable' ? 'grayscale' : '',
          ]"
        >
          <img
            :src="provider.icon"
            :alt="provider.name"
            class="w-6 h-6 object-contain"
          />
        </div>
        <div class="flex-1 min-w-0">
          <CardTitle class="text-base font-normal truncate">
            {{ provider.name }}
          </CardTitle>
          <p
            v-if="provider.shortDescription"
            class="text-xs font-normal text-neutral-500 dark:text-neutral-400 truncate mt-0.5"
          >
            {{ provider.shortDescription }}
          </p>
        </div>
      </div>

      <!-- Tags Row (including New and Popular) -->
      <div class="flex flex-wrap gap-1 mt-2">
        <!-- New badge -->
        <span
          v-if="provider.isNew"
          class="text-[10px] text-white dark:text-neutral-900 bg-neutral-900 dark:bg-white px-1.5 py-0.5 rounded"
        >
          {{ t("connections.explore.badges.new") }}
        </span>
        <!-- Popular badge -->
        <span
          v-if="provider.isPopular && provider.status === 'available'"
          class="text-[10px] text-white dark:text-neutral-900 bg-neutral-900 dark:bg-white px-1.5 py-0.5 rounded"
        >
          {{ t("connections.explore.badges.popular") }}
        </span>
        <!-- Regular tags (max 3) -->
        <template v-if="provider.tags && provider.tags.length > 0">
          <span
            v-for="tag in provider.tags.slice(0, 3)"
            :key="tag"
            class="text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded"
          >
            {{ tag }}
          </span>
        </template>
      </div>
    </CardHeader>

    <CardFooter class="pt-2 mt-auto">
      <!-- Unavailable provider button -->
      <Button
        v-if="provider.status === 'unavailable'"
        variant="outline"
        class="w-full font-normal"
        disabled
      >
        {{ t("connections.actions.comingSoon") }}
      </Button>
      <!-- External provider button -->
      <Button
        v-else-if="provider.status === 'available' && provider.isExternal"
        as-child
        variant="outline"
        class="w-full font-normal"
      >
        <a
          :href="provider.externalUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-2"
        >
          {{ t("connections.actions.visitName", { name: websiteName }) }}
          <ExternalLink :size="14" />
        </a>
      </Button>
      <!-- Internal provider button -->
      <Button
        v-else-if="provider.status === 'available'"
        @click="emit('connect', provider.id)"
        variant="outline"
        class="w-full font-normal"
      >
        {{ t("connections.actions.connect") }}
      </Button>
    </CardFooter>
  </Card>
</template>
