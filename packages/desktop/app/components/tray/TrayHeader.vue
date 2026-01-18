<template>
  <header>
    <!-- Logo and Workspace Row (always visible) -->
    <div data-tauri-drag-region class="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing">
      <!-- Left: Logo -->
      <div data-tauri-drag-region class="flex items-center space-x-3">
        <img
          data-tauri-drag-region
          src="~/assets/nvisy.png"
          alt="Nvisy"
          class="w-7 h-7 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
        />
        <div data-tauri-drag-region class="flex flex-col">
          <span data-tauri-drag-region class="text-xs text-muted-foreground leading-tight">Nvisy</span>
          <span data-tauri-drag-region class="text-lg font-medium leading-tight">Studio</span>
        </div>
      </div>

      <!-- Right: Workspace Dropdown + Settings (only when authenticated) -->
      <div v-if="isAuthenticated" class="flex items-center space-x-2">
        <!-- Workspace Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" class="h-8 w-48 justify-between">
              <span class="text-sm font-normal truncate">{{ currentWorkspace.name }}</span>
              <ChevronDown class="w-3 h-3 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48">
            <DropdownMenuItem
              v-for="workspace in workspaces"
              :key="workspace.id"
              @click="selectWorkspace(workspace)"
            >
              <span class="text-sm truncate">{{ workspace.name }}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Settings Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
              <Settings class="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <!-- User Card (clickable) -->
            <DropdownMenuItem @click="goToSettings" class="p-0">
              <div class="flex items-center space-x-3 px-2 py-2 w-full">
                <Avatar class="h-8 w-8">
                  <AvatarImage :src="user.avatar" :alt="user.name" />
                  <AvatarFallback class="text-xs">{{ getInitials(user.name) }}</AvatarFallback>
                </Avatar>
                <div class="flex flex-col min-w-0">
                  <span class="text-sm truncate">{{ user.name }}</span>
                  <span class="text-xs text-muted-foreground truncate">{{ user.email }}</span>
                </div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem @click="goToSettings" class="text-sm">
              <SettingsIcon class="w-4 h-4 mr-2" />
              {{ $t('nav.settings') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="goToAbout" class="text-sm">
              <Info class="w-4 h-4 mr-2" />
              {{ $t('nav.about') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="checkForUpdates" class="text-sm">
              <RefreshCw class="w-4 h-4 mr-2" />
              {{ $t('nav.update') }}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem @click="quit" class="text-destructive focus:text-destructive text-sm">
              <Power class="w-4 h-4 mr-2" />
              {{ $t('nav.quit') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Navigation Tabs (only when authenticated) -->
    <div v-if="isAuthenticated" class="mx-3 mb-1.5 px-1.5 py-0.5 bg-white dark:bg-neutral-950 rounded-lg border border-white/50 dark:border-neutral-800/50 shadow-sm">
      <!-- Main Navigation -->
      <Tabs v-if="!isSettingsMode" :model-value="activeTab" @update:model-value="setActiveTab" class="w-full">
        <TabsList class="w-full justify-start h-7 bg-transparent p-0 gap-0.5">
          <TabsTrigger
            value="files"
            class="text-xs px-2.5 h-6 data-[state=active]:bg-accent rounded-md relative"
          >
            <FileText class="w-3 h-3 mr-1" />
            {{ $t('nav.files') }}
            <span
              v-if="fileNotifications > 0"
              class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center"
            >
              {{ fileNotifications }}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            class="text-xs px-2.5 h-6 data-[state=active]:bg-accent rounded-md relative"
          >
            <Puzzle class="w-3 h-3 mr-1" />
            {{ $t('nav.integrations') }}
            <span
              v-if="integrationNotifications > 0"
              class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-500 text-white text-[9px] rounded-full flex items-center justify-center"
            >
              {{ integrationNotifications }}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="services"
            class="text-xs px-2.5 h-6 data-[state=active]:bg-accent rounded-md"
          >
            <Server class="w-3 h-3 mr-1" />
            {{ $t('nav.services') }}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <!-- Settings Navigation -->
      <Tabs v-else :model-value="activeTab" @update:model-value="setActiveTab" class="w-full">
        <TabsList class="w-full justify-start h-7 bg-transparent p-0 gap-0.5">
          <Button variant="ghost" size="sm" class="h-6 w-6 p-0 mr-0.5" @click="goBack">
            <ArrowLeft class="w-3.5 h-3.5" />
          </Button>
          <TabsTrigger
            value="settings"
            class="text-xs px-2.5 h-6 data-[state=active]:bg-accent rounded-md"
          >
            <SettingsIcon class="w-3 h-3 mr-1" />
            {{ $t('nav.settings') }}
          </TabsTrigger>
          <TabsTrigger
            value="about"
            class="text-xs px-2.5 h-6 data-[state=active]:bg-accent rounded-md"
          >
            <Info class="w-3 h-3 mr-1" />
            {{ $t('nav.about') }}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
	ArrowLeft,
	ChevronDown,
	FileText,
	Info,
	Power,
	Puzzle,
	RefreshCw,
	Server,
	Settings,
	Settings as SettingsIcon,
} from "lucide-vue-next";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useActiveTab } from "~/composables/useActiveTab";
import { useAuth } from "~/composables/useAuth";
import { getInitials } from "~/utils/naming";

// Auth state
const { isAuthenticated } = useAuth();

// Active tab (shared state)
const activeTab = useActiveTab();

// Track the previous main tab to return to
const previousMainTab = ref<string>("files");

// Check if we're in settings mode
const isSettingsMode = computed(() => {
	return activeTab.value === "settings" || activeTab.value === "about";
});

// Set active tab
const setActiveTab = (val: string | number) => {
	activeTab.value = val as string;
};

// User data
const user = ref({
	name: "John Doe",
	email: "john@example.com",
	avatar: "",
});

// Current workspace
const currentWorkspace = ref({
	id: "workspace-1",
	name: "Personal",
});

// Available workspaces
const workspaces = ref([
	{ id: "workspace-1", name: "My Workspace" },
	{ id: "workspace-2", name: "My Very Long Workspace Name" },
]);

// Notification badges
const fileNotifications = ref(2);
const integrationNotifications = ref(1);

// Select workspace
const selectWorkspace = (workspace: { id: string; name: string }) => {
	currentWorkspace.value = workspace;
};

// Navigate to settings
const goToSettings = () => {
	if (!isSettingsMode.value) {
		previousMainTab.value = activeTab.value;
	}
	activeTab.value = "settings";
};

// Navigate to about
const goToAbout = () => {
	if (!isSettingsMode.value) {
		previousMainTab.value = activeTab.value;
	}
	activeTab.value = "about";
};

// Go back to main navigation
const goBack = () => {
	activeTab.value = previousMainTab.value;
};

// Actions
const checkForUpdates = () => {
	console.log("Checking for updates...");
};

const quit = () => {
	console.log("Quitting...");
};
</script>
