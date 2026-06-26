<script setup lang="ts">
import { ref, computed } from "vue";
import {
	Search,
	ArrowLeft,
	Cloud,
	MessageSquare,
	Database,
	Bot,
	Filter,
	ArrowUpDown,
	Puzzle,
	Code,
} from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import { IntegrationCard } from "#console/components/pages/integrations";

const { t } = useI18n();

useHead({ title: "Explore Integrations" });

definePageMeta({
	pageCategory: "Integrations",
});

/**
 * Tag keys that match the i18n keys
 */
type TagKey =
	| "fileSync"
	| "import"
	| "export"
	| "notifications"
	| "messaging"
	| "collaboration"
	| "notes"
	| "database"
	| "analytics"
	| "automation"
	| "noCode"
	| "ai"
	| "enterprise"
	| "developer"
	| "sdk";

/**
 * Integration data structure
 */
interface Integration {
	id: string;
	nameKey: string;
	descriptionKey: string;
	shortDescriptionKey?: string;
	icon: string;
	status: "available" | "unavailable";
	category: string;
	tags: TagKey[];
	popularity: number;
	isNew?: boolean;
	isExternal?: boolean;
	externalUrl?: string;
}

interface Category {
	key: string;
	nameKey: string;
	icon: any;
}

const searchQuery = ref("");
const selectedCategories = ref<Set<string>>(new Set());
const statusFilter = ref<"all" | "available" | "unavailable">("all");
const sortBy = ref<"popularity" | "nameAsc" | "nameDesc">("popularity");

// Category definitions for filters
const categories = ref<Category[]>([
	{
		key: "cloud-storage",
		nameKey: "integrations.explore.categories.cloudStorage.name",
		icon: Cloud,
	},
	{
		key: "productivity",
		nameKey: "integrations.explore.categories.productivity.name",
		icon: MessageSquare,
	},
	{
		key: "data-analytics",
		nameKey: "integrations.explore.categories.dataAnalytics.name",
		icon: Database,
	},
	{
		key: "ai-enhancements",
		nameKey: "integrations.explore.categories.ai.name",
		icon: Bot,
	},
	{
		key: "sdk",
		nameKey: "integrations.explore.categories.sdk.name",
		icon: Code,
	},
]);

// All integrations as a flat list (only those with brand icons)
const integrations = ref<Integration[]>([
	// Cloud Storage
	{
		id: "google-drive",
		nameKey: "integrations.explore.items.googleDrive.name",
		descriptionKey: "integrations.explore.items.googleDrive.description",
		icon: "/integration/google-drive.svg",
		status: "available",
		category: "cloud-storage",
		tags: ["fileSync", "import", "export"],
		popularity: 95,
	},
	{
		id: "onedrive",
		nameKey: "integrations.explore.items.oneDrive.name",
		descriptionKey: "integrations.explore.items.oneDrive.description",
		icon: "/integration/microsoft-onedrive.svg",
		status: "available",
		category: "cloud-storage",
		tags: ["fileSync", "import", "export", "enterprise"],
		popularity: 85,
	},
	{
		id: "dropbox",
		nameKey: "integrations.explore.items.dropbox.name",
		descriptionKey: "integrations.explore.items.dropbox.description",
		icon: "/integration/dropbox.svg",
		status: "unavailable",
		category: "cloud-storage",
		tags: ["fileSync", "import", "export"],
		popularity: 70,
	},
	{
		id: "aws-s3",
		nameKey: "integrations.explore.items.awsS3.name",
		descriptionKey: "integrations.explore.items.awsS3.description",
		shortDescriptionKey: "integrations.explore.items.awsS3.shortDescription",
		icon: "/integration/minio.svg",
		status: "available",
		category: "cloud-storage",
		tags: ["fileSync", "developer", "enterprise"],
		popularity: 80,
	},
	// Productivity
	{
		id: "slack",
		nameKey: "integrations.explore.items.slack.name",
		descriptionKey: "integrations.explore.items.slack.description",
		icon: "/integration/slack.svg",
		status: "unavailable",
		category: "productivity",
		tags: ["notifications", "messaging", "collaboration"],
		popularity: 85,
	},
	{
		id: "teams",
		nameKey: "integrations.explore.items.teams.name",
		descriptionKey: "integrations.explore.items.teams.description",
		icon: "/integration/microsoft-teams.svg",
		status: "unavailable",
		category: "productivity",
		tags: ["notifications", "messaging", "collaboration", "enterprise"],
		popularity: 75,
	},
	{
		id: "notion",
		nameKey: "integrations.explore.items.notion.name",
		descriptionKey: "integrations.explore.items.notion.description",
		icon: "/integration/notion.svg",
		status: "available",
		category: "productivity",
		tags: ["notes", "collaboration", "export"],
		popularity: 85,
		isNew: true,
	},
	{
		id: "discord",
		nameKey: "integrations.explore.items.discord.name",
		descriptionKey: "integrations.explore.items.discord.description",
		icon: "/integration/discord.svg",
		status: "unavailable",
		category: "productivity",
		tags: ["notifications", "messaging", "collaboration"],
		popularity: 80,
	},
	// Data & Analytics
	{
		id: "zapier",
		nameKey: "integrations.explore.items.zapier.name",
		descriptionKey: "integrations.explore.items.zapier.description",
		icon: "/integration/zapier.svg",
		status: "available",
		category: "data-analytics",
		tags: ["automation", "noCode", "developer"],
		popularity: 92,
		isExternal: true,
		externalUrl: "https://zapier.com",
	},
	{
		id: "make",
		nameKey: "integrations.explore.items.make.name",
		descriptionKey: "integrations.explore.items.make.description",
		icon: "/integration/make.svg",
		status: "unavailable",
		category: "data-analytics",
		tags: ["automation", "noCode"],
		popularity: 68,
		isExternal: true,
		externalUrl: "https://www.make.com",
	},
	{
		id: "n8n",
		nameKey: "integrations.explore.items.n8n.name",
		descriptionKey: "integrations.explore.items.n8n.description",
		icon: "/integration/n8n.svg",
		status: "unavailable",
		category: "data-analytics",
		tags: ["automation", "noCode", "developer"],
		popularity: 58,
		isExternal: true,
		externalUrl: "https://n8n.io",
	},
	// AI & Enhancements
	{
		id: "chatgpt",
		nameKey: "integrations.explore.items.chatgpt.name",
		descriptionKey: "integrations.explore.items.chatgpt.description",
		icon: "/integration/openai.svg",
		status: "unavailable",
		category: "ai-enhancements",
		tags: ["ai", "automation"],
		popularity: 85,
	},
	{
		id: "claude",
		nameKey: "integrations.explore.items.claude.name",
		descriptionKey: "integrations.explore.items.claude.description",
		icon: "/integration/anthropic.svg",
		status: "unavailable",
		category: "ai-enhancements",
		tags: ["ai", "automation"],
		popularity: 85,
	},
	// SDKs
	{
		id: "javascript-sdk",
		nameKey: "integrations.explore.items.javascriptSdk.name",
		descriptionKey: "integrations.explore.items.javascriptSdk.description",
		shortDescriptionKey:
			"integrations.explore.items.javascriptSdk.shortDescription",
		icon: "/integration/javascript.svg",
		status: "available",
		category: "sdk",
		tags: ["sdk", "developer"],
		popularity: 85,
		isExternal: true,
		externalUrl: "https://www.npmjs.com/package/@nvisy/sdk",
	},
	{
		id: "python-sdk",
		nameKey: "integrations.explore.items.pythonSdk.name",
		descriptionKey: "integrations.explore.items.pythonSdk.description",
		shortDescriptionKey:
			"integrations.explore.items.pythonSdk.shortDescription",
		icon: "/integration/python.svg",
		status: "unavailable",
		category: "sdk",
		tags: ["sdk", "developer"],
		popularity: 88,
	},
]);

// Get localized name for an integration
function getIntegrationName(integration: Integration): string {
	return t(integration.nameKey);
}

// Get localized description for an integration
function getIntegrationDescription(integration: Integration): string {
	return t(integration.descriptionKey);
}

// Get localized short description for an integration
function getIntegrationShortDescription(
	integration: Integration,
): string | undefined {
	return integration.shortDescriptionKey
		? t(integration.shortDescriptionKey)
		: undefined;
}

// Get localized tag name
function getTagName(tagKey: TagKey): string {
	return t(`integrations.explore.tags.${tagKey}`);
}

// Filter and sort integrations
const filteredIntegrations = computed(() => {
	const query = searchQuery.value.toLowerCase().trim();

	const filtered = integrations.value.filter((integration) => {
		// Category filter (multi-select)
		if (
			selectedCategories.value.size > 0 &&
			!selectedCategories.value.has(integration.category)
		) {
			return false;
		}

		// Status filter
		if (
			statusFilter.value === "available" &&
			integration.status !== "available"
		) {
			return false;
		}
		if (
			statusFilter.value === "unavailable" &&
			integration.status !== "unavailable"
		) {
			return false;
		}

		// Search filter
		if (query) {
			const name = getIntegrationName(integration).toLowerCase();
			const description = getIntegrationDescription(integration).toLowerCase();
			const tagNames = integration.tags
				.map((tag) => getTagName(tag).toLowerCase())
				.join(" ");
			return (
				name.includes(query) ||
				description.includes(query) ||
				tagNames.includes(query)
			);
		}

		return true;
	});

	// Sort integrations
	return filtered.sort((a, b) => {
		// Always put available first
		if (a.status !== b.status) {
			return a.status === "available" ? -1 : 1;
		}

		switch (sortBy.value) {
			case "nameAsc":
				return getIntegrationName(a).localeCompare(getIntegrationName(b));
			case "nameDesc":
				return getIntegrationName(b).localeCompare(getIntegrationName(a));
			default:
				return b.popularity - a.popularity;
		}
	});
});

// Integrations filtered by search and status (but not category)
const baseFilteredIntegrations = computed(() => {
	const query = searchQuery.value.toLowerCase().trim();

	return integrations.value.filter((integration) => {
		// Status filter
		if (
			statusFilter.value === "available" &&
			integration.status !== "available"
		) {
			return false;
		}
		if (
			statusFilter.value === "unavailable" &&
			integration.status !== "unavailable"
		) {
			return false;
		}

		// Search filter
		if (query) {
			const name = getIntegrationName(integration).toLowerCase();
			const description = getIntegrationDescription(integration).toLowerCase();
			const tagNames = integration.tags
				.map((tag) => getTagName(tag).toLowerCase())
				.join(" ");
			return (
				name.includes(query) ||
				description.includes(query) ||
				tagNames.includes(query)
			);
		}

		return true;
	});
});

// Count integrations per category (respects search and status filters)
function getCategoryCount(categoryKey: string): number {
	return baseFilteredIntegrations.value.filter(
		(i) => i.category === categoryKey,
	).length;
}

// Total count for "All" button (respects search and status filters)
const totalFilteredCount = computed(
	() => baseFilteredIntegrations.value.length,
);

// Toggle category selection (multi-select)
function toggleCategory(key: string) {
	const newSet = new Set(selectedCategories.value);
	if (newSet.has(key)) {
		newSet.delete(key);
	} else {
		newSet.add(key);
	}
	selectedCategories.value = newSet;
}

// Clear all category filters
function clearCategoryFilters() {
	selectedCategories.value = new Set();
}

// Clear all filters
function clearAllFilters() {
	searchQuery.value = "";
	selectedCategories.value = new Set();
	statusFilter.value = "all";
}

function connectIntegration(_id: string | number) {
	// TODO: Implement integration connection
}

function notifyMe(_id: string | number) {
	// TODO: Implement notify me functionality
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-6xl mx-auto w-full">
      <!-- Header with Back Button and Search -->
      <div
        class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6"
      >
        <Button as-child variant="outline" class="font-normal">
          <NuxtLink to="/integrations" class="flex items-center gap-2">
            <ArrowLeft :size="16" />
            {{ t("integrations.actions.backToConnections") }}
          </NuxtLink>
        </Button>

        <div class="relative flex-1">
          <Search
            :size="16"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="searchQuery"
            :placeholder="t('integrations.forms.search.placeholder')"
            class="pl-10 h-9"
          />
        </div>

        <Select v-model="statusFilter">
          <SelectTrigger class="w-[160px] h-9 text-sm">
            <Filter :size="14" class="mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" class="text-sm font-normal">
              {{ t("integrations.explore.filters.allStatus") }}
            </SelectItem>
            <SelectItem value="available" class="text-sm font-normal">
              {{ t("integrations.explore.filters.availableOnly") }}
            </SelectItem>
            <SelectItem value="unavailable" class="text-sm font-normal">
              {{ t("integrations.explore.filters.unavailableOnly") }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="sortBy">
          <SelectTrigger class="w-[180px] h-9 text-sm">
            <ArrowUpDown :size="14" class="mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity" class="text-sm font-normal">
              {{ t("integrations.explore.sorting.popularity") }}
            </SelectItem>
            <SelectItem value="nameAsc" class="text-sm font-normal">
              {{ t("integrations.explore.sorting.nameAsc") }}
            </SelectItem>
            <SelectItem value="nameDesc" class="text-sm font-normal">
              {{ t("integrations.explore.sorting.nameDesc") }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Category Pills (Multi-select) -->
      <div class="flex flex-wrap gap-2 mb-8">
        <Button
          variant="outline"
          size="sm"
          :class="[
            'transition-colors',
            selectedCategories.size === 0
              ? 'bg-foreground text-background border-foreground'
              : '',
          ]"
          @click="clearCategoryFilters"
        >
          {{ t("integrations.explore.allCategories") }}
          <span class="ml-2 text-xs opacity-60">{{ totalFilteredCount }}</span>
        </Button>
        <Button
          v-for="category in categories"
          :key="category.key"
          variant="outline"
          size="sm"
          :class="[
            'transition-colors',
            selectedCategories.has(category.key)
              ? 'bg-foreground text-background border-foreground'
              : '',
          ]"
          @click="toggleCategory(category.key)"
        >
          <component :is="category.icon" :size="14" class="mr-1.5" />
          {{ t(category.nameKey) }}
          <span class="ml-2 text-xs opacity-60">{{
            getCategoryCount(category.key)
          }}</span>
        </Button>
      </div>

      <!-- No Results -->
      <div v-if="filteredIntegrations.length === 0" class="py-12 text-center">
        <div
          class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
        >
          <Puzzle class="size-5 text-muted-foreground" />
        </div>
        <p class="text-sm text-foreground mb-1">
          {{ t("integrations.explore.noResults") }}
        </p>
        <p class="text-xs text-muted-foreground mb-4">
          {{ t("integrations.explore.noResultsHint") }}
        </p>
        <Button
          v-if="
            searchQuery || selectedCategories.size > 0 || statusFilter !== 'all'
          "
          variant="outline"
          size="sm"
          @click="clearAllFilters"
        >
          {{ t("integrations.explore.clearFilters") }}
        </Button>
      </div>

      <!-- Integration Cards Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <IntegrationCard
          v-for="integration in filteredIntegrations"
          :key="integration.id"
          :integration="{
            id: integration.id,
            name: getIntegrationName(integration),
            description: getIntegrationDescription(integration),
            shortDescription: getIntegrationShortDescription(integration),
            icon: integration.icon,
            status: integration.status,
            tags: integration.tags.map((tag) => getTagName(tag)),
            isNew: integration.isNew,
            isPopular: integration.popularity >= 90,
            isExternal: integration.isExternal,
            externalUrl: integration.externalUrl,
          }"
          @connect="connectIntegration"
          @notify-me="notifyMe"
        />
      </div>
    </div>
  </div>
</template>
