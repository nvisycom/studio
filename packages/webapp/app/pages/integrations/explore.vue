<script setup lang="ts">
import { ref, computed } from "vue";
const { t } = useI18n();
import {
	Search,
	ChevronDown,
	Workflow,
	HardDrive,
	ArrowLeft,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IntegrationCard } from "@/components/integrations";

definePageMeta({
	pageName: "Integrations",
});

/**
 * Integration data structure
 */
interface Integration {
	id: number;
	name: string;
	description: string;
	icon: any;
	color: string;
	status: "available" | "coming-soon";
	category: string;
	tags: string[];
	isExternal?: boolean;
	externalUrl?: string;
}

const searchQuery = ref("");

// Tag filters
const selectedTags = ref({
	fileStorage: false,
	automation: false,
});

const integrations = ref<Integration[]>([
	// File Storage
	{
		id: 1,
		name: "Google Drive",
		description:
			"Import and export documents directly to and from Google Drive",
		icon: HardDrive,
		color: "bg-blue-600",
		status: "available",
		category: "File Storage",
		tags: ["fileStorage"],
	},
	{
		id: 2,
		name: "Microsoft OneDrive",
		description:
			"Seamlessly import and export files with Microsoft OneDrive integration",
		icon: HardDrive,
		color: "bg-sky-600",
		status: "available",
		category: "File Storage",
		tags: ["fileStorage"],
	},
	{
		id: 3,
		name: "Dropbox",
		description: "Connect Dropbox for easy file import and export workflows",
		icon: HardDrive,
		color: "bg-indigo-600",
		status: "available",
		category: "File Storage",
		tags: ["fileStorage"],
	},
	// Automation
	{
		id: 4,
		name: "Zapier",
		description: "Automate redaction workflows with Zapier's no-code platform",
		icon: Workflow,
		color: "bg-orange-600",
		status: "available",
		category: "Automation",
		tags: ["automation"],
		isExternal: true,
		externalUrl: "https://zapier.com",
	},
	{
		id: 5,
		name: "Make",
		description:
			"Build complex automation scenarios with Make (formerly Integromat)",
		icon: Workflow,
		color: "bg-fuchsia-600",
		status: "available",
		category: "Automation",
		tags: ["automation"],
		isExternal: true,
		externalUrl: "https://www.make.com",
	},
	{
		id: 6,
		name: "n8n",
		description: "Create custom automation workflows with n8n's visual editor",
		icon: Workflow,
		color: "bg-pink-600",
		status: "available",
		category: "Automation",
		tags: ["automation"],
		isExternal: true,
		externalUrl: "https://n8n.io",
	},
]);

const filteredIntegrations = computed(() => {
	let filtered = integrations.value;

	// Apply search filter
	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase();
		filtered = filtered.filter(
			(integration) =>
				integration.name.toLowerCase().includes(query) ||
				integration.description.toLowerCase().includes(query) ||
				integration.category.toLowerCase().includes(query),
		);
	}

	// Apply tag filters
	const activeTags = Object.entries(selectedTags.value)
		.filter(([_, isSelected]) => isSelected)
		.map(([tag, _]) => tag);

	if (activeTags.length > 0) {
		filtered = filtered.filter((integration) =>
			integration.tags.some((tag) => activeTags.includes(tag)),
		);
	}

	return filtered;
});

const activeTagCount = computed(() => {
	return Object.values(selectedTags.value).filter((val) => val).length;
});

function connectIntegration(id: number) {
	console.log("Connect integration:", id);
}

function notifyMe(id: number) {
	console.log("Notify about integration:", id);
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Search and Filters -->
      <div
        class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6"
      >
        <Button as-child>
          <NuxtLink to="/integrations" class="flex items-center gap-2">
            <ArrowLeft :size="16" />
            Back to Connections
          </NuxtLink>
        </Button>

        <div class="relative flex-1">
          <Search
            :size="16"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            v-model="searchQuery"
            :placeholder="t('integrations.forms.search.placeholder')"
            class="pl-10 border-neutral-300 dark:border-neutral-700"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="outline"
              class="justify-between min-w-[160px] border-neutral-300 dark:border-neutral-700"
            >
              {{
                activeTagCount > 0
                  ? t("integrations.categories.tags")
                  : t("integrations.categories.anyTag")
              }}
              <span
                v-if="activeTagCount > 0"
                class="ml-2 px-1.5 py-0.5 text-xs rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
              >
                {{ activeTagCount }}
              </span>
              <ChevronDown :size="16" class="ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-56">
            <DropdownMenuCheckboxItem
              v-model:checked="selectedTags.fileStorage"
            >
              {{ t("integrations.categories.fileStorage") }}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem v-model:checked="selectedTags.automation">
              {{ t("integrations.categories.automation") }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Integrations Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <IntegrationCard
          v-for="integration in filteredIntegrations"
          :key="integration.id"
          :integration="integration"
          @connect="connectIntegration"
          @notify-me="notifyMe"
        />
      </div>
    </div>
  </div>
</template>
