<template>
  <div class="space-y-1.5 animate-in fade-in duration-200">
    <!-- Empty State -->
    <div v-if="integrations.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
      <Puzzle class="w-10 h-10 text-muted-foreground/50 mb-3" />
      <p class="text-sm text-muted-foreground mb-1">{{ $t('integrations.empty.title') }}</p>
      <p class="text-xs text-muted-foreground">{{ $t('integrations.empty.description') }}</p>
    </div>

    <ContextMenu v-for="integration in integrations" :key="integration.id">
      <ContextMenuTrigger as-child>
        <div
          class="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors bg-muted/30"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-7 h-7 rounded flex items-center justify-center"
              :style="{ backgroundColor: integration.color }"
            >
              <component :is="integration.icon" class="w-4 h-4 text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[15px]">{{ integration.name }}</p>
              <p class="text-xs text-muted-foreground">{{ integration.description }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <!-- Status dot (only visible when enabled) -->
            <div
              v-if="integration.enabled"
              class="w-2 h-2 rounded-full flex-shrink-0 transition-opacity"
              :class="getStatusColor(integration.status)"
            />
            <Switch
              :model-value="integration.enabled"
              disabled
              class="scale-75"
            />
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent class="w-40">
        <ContextMenuItem @click="viewIntegration(integration)">
          <Eye class="w-3.5 h-3.5 mr-2" />
          {{ $t('integrations.context.view') }}
        </ContextMenuItem>
        <ContextMenuItem @click="editIntegration(integration)">
          <Pencil class="w-3.5 h-3.5 mr-2" />
          {{ $t('integrations.context.edit') }}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          @click="toggleIntegration(integration)"
          :class="integration.enabled ? 'text-destructive focus:text-destructive' : ''"
        >
          <component :is="integration.enabled ? Unplug : Plug" class="w-3.5 h-3.5 mr-2" />
          {{ integration.enabled ? $t('integrations.context.disable') : $t('integrations.context.enable') }}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  </div>
</template>

<script setup lang="ts">
import {
	Cloud,
	Database,
	Eye,
	Github,
	Pencil,
	Plug,
	Puzzle,
	Slack,
	Unplug,
} from "lucide-vue-next";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { Switch } from "~/components/ui/switch";

// Mock integrations data with status and enabled state
const integrations = ref([
	{
		id: 1,
		name: "GitHub",
		description: "Repository sync",
		icon: Github,
		color: "#333",
		status: "green",
		enabled: true,
	},
	{
		id: 2,
		name: "Slack",
		description: "Notifications",
		icon: Slack,
		color: "#4A154B",
		status: "green",
		enabled: true,
	},
	{
		id: 3,
		name: "AWS S3",
		description: "Cloud storage",
		icon: Cloud,
		color: "#FF9900",
		status: "red",
		enabled: false,
	},
	{
		id: 4,
		name: "PostgreSQL",
		description: "Database",
		icon: Database,
		color: "#336791",
		status: "yellow",
		enabled: true,
	},
]);

// Helper function to get status color
const getStatusColor = (status: string) => {
	switch (status) {
		case "green":
			return "bg-green-500";
		case "yellow":
			return "bg-yellow-500";
		case "red":
			return "bg-red-500";
		default:
			return "bg-muted";
	}
};

// Integration actions
const viewIntegration = (integration: { id: number; name: string }) => {
	// Open in browser
	console.log("View:", integration.name);
	window.open("https://app.nvisy.com/integrations", "_blank");
};

const editIntegration = (integration: { id: number; name: string }) => {
	// Open in browser
	console.log("Edit:", integration.name);
	window.open("https://app.nvisy.com/integrations", "_blank");
};

const toggleIntegration = (integration: {
	id: number;
	name: string;
	enabled: boolean;
}) => {
	const idx = integrations.value.findIndex((i) => i.id === integration.id);
	if (idx !== -1) {
		integrations.value[idx].enabled = !integrations.value[idx].enabled;
	}
};
</script>
