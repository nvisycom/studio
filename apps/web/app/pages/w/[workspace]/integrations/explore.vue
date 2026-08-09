<script setup lang="ts">
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
import {
	ProviderCard,
	ConnectConnectionDialog,
	ConnectLlmDialog,
} from "#console/components/pages/connections";
import type {
	StorageProvider,
	LlmProvider,
} from "#console/utils/connectionProviders";
import {
	storageProviderForCard,
	llmProviderForCard,
} from "#console/utils/connectionProviders";
import type { CreateConnection } from "@nvisy/sdk/datatypes";
import { toast } from "vue-sonner";

const { t } = useI18n();
const { wLink } = useWorkspaceLink();
const { createConnectionAsync, isCreating } = useConnections();

useHead({ title: "Explore Providers" });

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
 * Provider data structure
 */
interface Provider {
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
		nameKey: "connections.explore.categories.cloudStorage.name",
		icon: Cloud,
	},
	{
		key: "productivity",
		nameKey: "connections.explore.categories.productivity.name",
		icon: MessageSquare,
	},
	{
		key: "data-analytics",
		nameKey: "connections.explore.categories.dataAnalytics.name",
		icon: Database,
	},
	{
		key: "ai-enhancements",
		nameKey: "connections.explore.categories.ai.name",
		icon: Bot,
	},
	{
		key: "sdk",
		nameKey: "connections.explore.categories.sdk.name",
		icon: Code,
	},
]);

// All providers as a flat list (only those with brand icons)
const providers = ref<Provider[]>([
	// Cloud Storage
	{
		id: "google-drive",
		nameKey: "connections.explore.items.googleDrive.name",
		descriptionKey: "connections.explore.items.googleDrive.description",
		icon: "/integration/google-drive.svg",
		status: "unavailable",
		category: "cloud-storage",
		tags: ["fileSync", "import", "export"],
		popularity: 95,
	},
	{
		id: "onedrive",
		nameKey: "connections.explore.items.oneDrive.name",
		descriptionKey: "connections.explore.items.oneDrive.description",
		icon: "/integration/microsoft-onedrive.svg",
		status: "unavailable",
		category: "cloud-storage",
		tags: ["fileSync", "import", "export", "enterprise"],
		popularity: 85,
	},
	{
		id: "dropbox",
		nameKey: "connections.explore.items.dropbox.name",
		descriptionKey: "connections.explore.items.dropbox.description",
		icon: "/integration/dropbox.svg",
		status: "unavailable",
		category: "cloud-storage",
		tags: ["fileSync", "import", "export"],
		popularity: 70,
	},
	{
		id: "aws-s3",
		nameKey: "connections.explore.items.awsS3.name",
		descriptionKey: "connections.explore.items.awsS3.description",
		shortDescriptionKey: "connections.explore.items.awsS3.shortDescription",
		icon: "/integration/aws-s3.svg",
		status: "available",
		category: "cloud-storage",
		tags: ["fileSync", "developer", "enterprise"],
		popularity: 80,
	},
	{
		id: "azure",
		nameKey: "connections.explore.items.azure.name",
		descriptionKey: "connections.explore.items.azure.description",
		shortDescriptionKey: "connections.explore.items.azure.shortDescription",
		icon: "/integration/azure.svg",
		status: "available",
		category: "cloud-storage",
		tags: ["fileSync", "enterprise"],
		popularity: 78,
	},
	{
		id: "gcs",
		nameKey: "connections.explore.items.gcs.name",
		descriptionKey: "connections.explore.items.gcs.description",
		shortDescriptionKey: "connections.explore.items.gcs.shortDescription",
		icon: "/integration/gcs.svg",
		status: "available",
		category: "cloud-storage",
		tags: ["fileSync", "enterprise"],
		popularity: 76,
	},
	// Productivity
	{
		id: "slack",
		nameKey: "connections.explore.items.slack.name",
		descriptionKey: "connections.explore.items.slack.description",
		icon: "/integration/slack.svg",
		status: "unavailable",
		category: "productivity",
		tags: ["notifications", "messaging", "collaboration"],
		popularity: 85,
	},
	{
		id: "teams",
		nameKey: "connections.explore.items.teams.name",
		descriptionKey: "connections.explore.items.teams.description",
		icon: "/integration/microsoft-teams.svg",
		status: "unavailable",
		category: "productivity",
		tags: ["notifications", "messaging", "collaboration", "enterprise"],
		popularity: 75,
	},
	{
		id: "notion",
		nameKey: "connections.explore.items.notion.name",
		descriptionKey: "connections.explore.items.notion.description",
		icon: "/integration/notion.svg",
		status: "unavailable",
		category: "productivity",
		tags: ["notes", "collaboration", "export"],
		popularity: 85,
	},
	{
		id: "discord",
		nameKey: "connections.explore.items.discord.name",
		descriptionKey: "connections.explore.items.discord.description",
		icon: "/integration/discord.svg",
		status: "unavailable",
		category: "productivity",
		tags: ["notifications", "messaging", "collaboration"],
		popularity: 80,
	},
	// Data & Analytics
	{
		id: "zapier",
		nameKey: "connections.explore.items.zapier.name",
		descriptionKey: "connections.explore.items.zapier.description",
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
		nameKey: "connections.explore.items.make.name",
		descriptionKey: "connections.explore.items.make.description",
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
		nameKey: "connections.explore.items.n8n.name",
		descriptionKey: "connections.explore.items.n8n.description",
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
		nameKey: "connections.explore.items.chatgpt.name",
		descriptionKey: "connections.explore.items.chatgpt.description",
		shortDescriptionKey: "connections.explore.items.chatgpt.shortDescription",
		icon: "/integration/openai.svg",
		status: "available",
		category: "ai-enhancements",
		tags: ["ai", "automation"],
		popularity: 90,
	},
	{
		id: "claude",
		nameKey: "connections.explore.items.claude.name",
		descriptionKey: "connections.explore.items.claude.description",
		shortDescriptionKey: "connections.explore.items.claude.shortDescription",
		icon: "/integration/anthropic.svg",
		status: "available",
		category: "ai-enhancements",
		tags: ["ai", "automation"],
		popularity: 88,
	},
	{
		id: "ollama",
		nameKey: "connections.explore.items.ollama.name",
		descriptionKey: "connections.explore.items.ollama.description",
		shortDescriptionKey: "connections.explore.items.ollama.shortDescription",
		icon: "/integration/ollama.svg",
		status: "available",
		category: "ai-enhancements",
		tags: ["ai", "developer"],
		popularity: 80,
	},
	// SDKs
	{
		id: "javascript-sdk",
		nameKey: "connections.explore.items.javascriptSdk.name",
		descriptionKey: "connections.explore.items.javascriptSdk.description",
		shortDescriptionKey:
			"connections.explore.items.javascriptSdk.shortDescription",
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
		nameKey: "connections.explore.items.pythonSdk.name",
		descriptionKey: "connections.explore.items.pythonSdk.description",
		shortDescriptionKey: "connections.explore.items.pythonSdk.shortDescription",
		icon: "/integration/python.svg",
		status: "available",
		category: "sdk",
		tags: ["sdk", "developer"],
		popularity: 88,
		isExternal: true,
		externalUrl: "https://pypi.org/project/nvisy-sdk/",
	},
	{
		id: "rust-sdk",
		nameKey: "connections.explore.items.rustSdk.name",
		descriptionKey: "connections.explore.items.rustSdk.description",
		shortDescriptionKey: "connections.explore.items.rustSdk.shortDescription",
		icon: "/integration/rust.svg",
		status: "available",
		category: "sdk",
		tags: ["sdk", "developer"],
		popularity: 80,
		isExternal: true,
		externalUrl: "https://crates.io/crates/nvisy-sdk",
	},
]);

// Get localized name for a provider
function getProviderName(provider: Provider): string {
	return t(provider.nameKey);
}

// Get localized description for a provider
function getProviderDescription(provider: Provider): string {
	return t(provider.descriptionKey);
}

// Get localized short description for a provider
function getProviderShortDescription(provider: Provider): string | undefined {
	return provider.shortDescriptionKey
		? t(provider.shortDescriptionKey)
		: undefined;
}

// Get localized tag name
function getTagName(tagKey: TagKey): string {
	return t(`connections.explore.tags.${tagKey}`);
}

// Filter and sort providers
const filteredProviders = computed(() => {
	const query = searchQuery.value.toLowerCase().trim();

	const filtered = providers.value.filter((provider) => {
		// Category filter (multi-select)
		if (
			selectedCategories.value.size > 0 &&
			!selectedCategories.value.has(provider.category)
		) {
			return false;
		}

		// Status filter
		if (statusFilter.value === "available" && provider.status !== "available") {
			return false;
		}
		if (
			statusFilter.value === "unavailable" &&
			provider.status !== "unavailable"
		) {
			return false;
		}

		// Search filter
		if (query) {
			const name = getProviderName(provider).toLowerCase();
			const description = getProviderDescription(provider).toLowerCase();
			const tagNames = provider.tags
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

	// Sort providers
	return filtered.sort((a, b) => {
		// Always put available first
		if (a.status !== b.status) {
			return a.status === "available" ? -1 : 1;
		}

		switch (sortBy.value) {
			case "nameAsc":
				return getProviderName(a).localeCompare(getProviderName(b));
			case "nameDesc":
				return getProviderName(b).localeCompare(getProviderName(a));
			default:
				return b.popularity - a.popularity;
		}
	});
});

// Providers filtered by search and status (but not category)
const baseFilteredProviders = computed(() => {
	const query = searchQuery.value.toLowerCase().trim();

	return providers.value.filter((provider) => {
		// Status filter
		if (statusFilter.value === "available" && provider.status !== "available") {
			return false;
		}
		if (
			statusFilter.value === "unavailable" &&
			provider.status !== "unavailable"
		) {
			return false;
		}

		// Search filter
		if (query) {
			const name = getProviderName(provider).toLowerCase();
			const description = getProviderDescription(provider).toLowerCase();
			const tagNames = provider.tags
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

// Count providers per category (respects search and status filters)
function getCategoryCount(categoryKey: string): number {
	return baseFilteredProviders.value.filter((i) => i.category === categoryKey)
		.length;
}

// Total count for "All" button (respects search and status filters)
const totalFilteredCount = computed(() => baseFilteredProviders.value.length);

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

// Connect dialog state (storage)
const connectDialogOpen = ref(false);
const connectProviderTag = ref<StorageProvider | null>(null);
const connectProviderName = ref("");
const connectProviderIcon = ref("");

// Connect dialog state (LLM)
const llmDialogOpen = ref(false);
const llmProviderTag = ref<LlmProvider | null>(null);

function connectProvider(id: string | number) {
	const cardId = String(id);

	// LLM providers use their own dialog (different config shape).
	const llm = llmProviderForCard(cardId);
	if (llm) {
		llmProviderTag.value = llm;
		llmDialogOpen.value = true;
		return;
	}

	const provider = storageProviderForCard(cardId);
	if (!provider) return; // not a connectable provider

	const card = providers.value.find((p) => p.id === id);
	connectProviderTag.value = provider;
	connectProviderName.value = card ? getProviderName(card) : "";
	connectProviderIcon.value = card?.icon ?? "";
	connectDialogOpen.value = true;
}

async function handleConnect(connection: CreateConnection) {
	try {
		await createConnectionAsync(connection);
		connectDialogOpen.value = false;
		toast.success(t("connections.dialogs.connect.success"));
		await navigateTo(wLink("/integrations"));
	} catch {
		toast.error(t("connections.dialogs.connect.error"));
	}
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
          <NuxtLink :to="wLink('/integrations')" class="flex items-center gap-2">
            <ArrowLeft :size="16" />
            {{ t("connections.actions.backToConnections") }}
          </NuxtLink>
        </Button>

        <div class="relative flex-1">
          <Search
            :size="16"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="searchQuery"
            :placeholder="t('connections.forms.search.placeholder')"
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
              {{ t("connections.explore.filters.allStatus") }}
            </SelectItem>
            <SelectItem value="available" class="text-sm font-normal">
              {{ t("connections.explore.filters.availableOnly") }}
            </SelectItem>
            <SelectItem value="unavailable" class="text-sm font-normal">
              {{ t("connections.explore.filters.unavailableOnly") }}
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
              {{ t("connections.explore.sorting.popularity") }}
            </SelectItem>
            <SelectItem value="nameAsc" class="text-sm font-normal">
              {{ t("connections.explore.sorting.nameAsc") }}
            </SelectItem>
            <SelectItem value="nameDesc" class="text-sm font-normal">
              {{ t("connections.explore.sorting.nameDesc") }}
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
          {{ t("connections.explore.allCategories") }}
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
      <div v-if="filteredProviders.length === 0" class="py-12 text-center">
        <div
          class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
        >
          <Puzzle class="size-5 text-muted-foreground" />
        </div>
        <p class="text-sm text-foreground mb-1">
          {{ t("connections.explore.noResults") }}
        </p>
        <p class="text-xs text-muted-foreground mb-4">
          {{ t("connections.explore.noResultsHint") }}
        </p>
        <Button
          v-if="
            searchQuery || selectedCategories.size > 0 || statusFilter !== 'all'
          "
          variant="outline"
          size="sm"
          @click="clearAllFilters"
        >
          {{ t("connections.explore.clearFilters") }}
        </Button>
      </div>

      <!-- Provider Cards Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <ProviderCard
          v-for="provider in filteredProviders"
          :key="provider.id"
          :provider="{
            id: provider.id,
            name: getProviderName(provider),
            description: getProviderDescription(provider),
            shortDescription: getProviderShortDescription(provider),
            icon: provider.icon,
            status: provider.status,
            tags: provider.tags.map((tag) => getTagName(tag)),
            isNew: provider.isNew,
            isPopular: provider.popularity >= 90,
            isExternal: provider.isExternal,
            externalUrl: provider.externalUrl,
          }"
          @connect="connectProvider"
          @notify-me="notifyMe"
        />
      </div>

      <!-- Connect dialog (storage) -->
      <ConnectConnectionDialog
        v-model:open="connectDialogOpen"
        :provider="connectProviderTag"
        :provider-name="connectProviderName"
        :provider-icon="connectProviderIcon"
        :is-loading="isCreating"
        @connect="handleConnect"
      />

      <!-- Connect dialog (LLM) -->
      <ConnectLlmDialog
        v-model:open="llmDialogOpen"
        :provider="llmProviderTag"
        :is-loading="isCreating"
        @connect="handleConnect"
      />
    </div>
  </div>
</template>
