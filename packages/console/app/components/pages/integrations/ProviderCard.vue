<script setup lang="ts">
import { ExternalLink, Plus } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Badge } from "#console/components/ui/badge";

const { t } = useI18n();

/**
 * A provider surfaced on the explore page. `kind` splits two fundamentally
 * different things the page used to blend together:
 *  - `connectable`: services you enable here, creating a {@link Connection}
 *    (cloud storage, object stores, bots, AI models).
 *  - `recommendation`: routes that live outside the console (SDKs, automation
 *    tools). These never create a connection; they link out.
 *
 * `availability` gives a connectable one of three states:
 *  - `available`: connect now.
 *  - `unconfigured`: Nvisy supports it, but this deployment hasn't set it up
 *    (no OAuth app). Shown as "Not configured", not "Coming soon" - it's real,
 *    just not wired up here. Common on self-hosted deployments.
 *  - `comingSoon`: not built yet, genuinely on the roadmap.
 */
interface Provider {
	id: string | number;
	name: string;
	description: string;
	shortDescription?: string;
	icon: string;
	kind: "connectable" | "recommendation";
	availability: "available" | "unconfigured" | "comingSoon";
	tags?: string[];
	isNew?: boolean;
	isExternal?: boolean;
	externalUrl?: string;
}

const props = defineProps<{ provider: Provider }>();
const emit = defineEmits<(e: "connect", id: string | number) => void>();

// Recommendation cards read as "lives elsewhere": a pointer out, not a connect.
const isRecommendation = computed(
	() => props.provider.kind === "recommendation",
);
const canConnect = computed(
	() =>
		props.provider.kind === "connectable" &&
		props.provider.availability === "available",
);
const isUnconfigured = computed(
	() => props.provider.availability === "unconfigured",
);
const isComingSoon = computed(
	() =>
		props.provider.kind === "connectable" &&
		props.provider.availability === "comingSoon",
);
// Both non-connectable states gray the icon (nothing to connect right now).
const dimmed = computed(() => isUnconfigured.value || isComingSoon.value);

/** "https://www.npmjs.com/…" → "npmjs.com" for the Visit label. */
const websiteName = computed(() => {
	const url = props.provider.externalUrl;
	if (!url) return "";
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return "";
	}
});
</script>

<template>
  <div
    :class="[
      'group flex items-center gap-3 rounded-lg border border-border p-3 transition-colors',
      isRecommendation
        ? 'bg-muted/30 hover:border-foreground/20'
        : 'bg-card hover:border-foreground/20',
    ]"
  >
    <!-- Bigger icon tile -->
    <div
      :class="[
        'flex size-11 shrink-0 items-center justify-center rounded-lg border border-border/60',
        dimmed ? 'bg-muted/40' : 'bg-muted/60',
      ]"
    >
      <img
        :src="provider.icon"
        :alt="provider.name"
        :class="['size-6 object-contain', dimmed ? 'opacity-60 grayscale' : '']"
      />
    </div>

    <!-- Name + description stacked to the right of the icon -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1.5">
        <p class="truncate text-sm font-medium text-foreground">
          {{ provider.name }}
        </p>
        <Badge v-if="provider.isNew" class="h-4 px-1.5 text-[10px]">
          {{ t("connections.explore.badges.new") }}
        </Badge>
      </div>
      <p class="truncate text-xs text-muted-foreground">
        {{ provider.shortDescription || provider.description }}
      </p>
    </div>

    <!-- Action on the far right, centered against the icon -->

    <!-- Supported by Nvisy, but not set up on this deployment. Labeled "Not
         configured" (not the misleading "Coming soon"). -->
    <span
      v-if="isUnconfigured"
      class="shrink-0 text-[11px] text-muted-foreground"
    >
      {{ t("connections.actions.notConfigured") }}
    </span>

    <span
      v-else-if="isComingSoon"
      class="shrink-0 text-[11px] text-muted-foreground"
    >
      {{ t("connections.actions.comingSoon") }}
    </span>
    <Button
      v-else-if="isRecommendation && provider.externalUrl"
      as-child
      variant="ghost"
      size="sm"
      class="h-7 shrink-0 px-2 font-normal text-muted-foreground hover:text-foreground"
    >
      <a
        :href="provider.externalUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5"
      >
        {{ t("connections.actions.visitName", { name: websiteName }) }}
        <ExternalLink :size="13" />
      </a>
    </Button>
    <Button
      v-else-if="canConnect"
      variant="outline"
      size="sm"
      class="h-7 shrink-0 px-2.5 font-normal"
      @click="emit('connect', provider.id)"
    >
      <Plus :size="13" />
      {{ t("connections.actions.connect") }}
    </Button>
  </div>
</template>
