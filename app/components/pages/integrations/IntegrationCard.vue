<script setup lang="ts">
import { ExternalLink } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const { t } = useI18n();

/**
 * Integration data structure
 */
interface Integration {
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
	integration: Integration;
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

const websiteName = computed(() =>
	getWebsiteName(props.integration.externalUrl),
);
</script>

<template>
  <Card
    :class="[
      'overflow-hidden border-neutral-200 dark:border-neutral-800 flex flex-col transition-all duration-200',
      integration.status === 'unavailable'
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
            integration.status === 'unavailable' ? 'grayscale' : '',
          ]"
        >
          <img
            :src="integration.icon"
            :alt="integration.name"
            class="w-6 h-6 object-contain"
          />
        </div>
        <div class="flex-1 min-w-0">
          <CardTitle class="text-base font-normal truncate">
            {{ integration.name }}
          </CardTitle>
          <p
            v-if="integration.shortDescription"
            class="text-xs font-normal text-neutral-500 dark:text-neutral-400 truncate mt-0.5"
          >
            {{ integration.shortDescription }}
          </p>
        </div>
      </div>

      <!-- Tags Row (including New and Popular) -->
      <div class="flex flex-wrap gap-1 mt-2">
        <!-- New badge -->
        <span
          v-if="integration.isNew"
          class="text-[10px] text-white dark:text-neutral-900 bg-neutral-900 dark:bg-white px-1.5 py-0.5 rounded"
        >
          {{ t("integrations.explore.badges.new") }}
        </span>
        <!-- Popular badge -->
        <span
          v-if="integration.isPopular && integration.status === 'available'"
          class="text-[10px] text-white dark:text-neutral-900 bg-neutral-900 dark:bg-white px-1.5 py-0.5 rounded"
        >
          {{ t("integrations.explore.badges.popular") }}
        </span>
        <!-- Regular tags (max 3) -->
        <template v-if="integration.tags && integration.tags.length > 0">
          <span
            v-for="tag in integration.tags.slice(0, 3)"
            :key="tag"
            class="text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded"
          >
            {{ tag }}
          </span>
        </template>
      </div>
    </CardHeader>

    <CardFooter class="pt-2 mt-auto">
      <!-- Unavailable integration button -->
      <Button
        v-if="integration.status === 'unavailable'"
        variant="outline"
        class="w-full font-normal"
        disabled
      >
        {{ t("integrations.actions.comingSoon") }}
      </Button>
      <!-- External integration button -->
      <Button
        v-else-if="integration.status === 'available' && integration.isExternal"
        as-child
        variant="outline"
        class="w-full font-normal"
      >
        <a
          :href="integration.externalUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-2"
        >
          {{ t("integrations.actions.visitName", { name: websiteName }) }}
          <ExternalLink :size="14" />
        </a>
      </Button>
      <!-- Internal integration button -->
      <Button
        v-else-if="integration.status === 'available'"
        @click="emit('connect', integration.id)"
        variant="outline"
        class="w-full font-normal"
      >
        {{ t("integrations.actions.connect") }}
      </Button>
    </CardFooter>
  </Card>
</template>
