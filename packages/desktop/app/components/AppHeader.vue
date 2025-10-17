<template>
  <header class="border-b border-border bg-background">
    <div class="flex h-12 items-center justify-between px-4">
      <!-- Left: Brand and Project Selection -->
      <div class="flex items-center space-x-4">
        <!-- Brand -->
        <div class="flex items-center space-x-2">
          <div class="font-semibold text-sm">Nvisy</div>
        </div>

        <!-- Separator -->
        <div class="w-px h-6 bg-border"></div>

        <!-- Project Selector -->
        <div class="flex items-center space-x-2 px-3 py-1.5 rounded-md border bg-card hover:bg-accent transition-colors cursor-pointer">
          <FolderOpen class="w-4 h-4 text-muted-foreground" />
          <span class="text-sm font-medium">{{ currentProject.name }}</span>
          <ChevronDown class="w-3 h-3 text-muted-foreground" />
        </div>
      </div>

      <!-- Right: Navigation and Actions -->
      <div class="flex items-center space-x-1">
        <!-- Documents -->
        <Button
          variant="ghost"
          size="sm"
          class="h-8 px-3 text-xs"
          :class="{ 'bg-accent': activeSection === 'documents' }"
        >
          <FileText class="w-3 h-3 mr-1.5" />
          Documents
        </Button>

        <!-- Integrations -->
        <Button
          variant="ghost"
          size="sm"
          class="h-8 px-3 text-xs"
          :class="{ 'bg-accent': activeSection === 'integrations' }"
        >
          <Puzzle class="w-3 h-3 mr-1.5" />
          Integrations
        </Button>

        <!-- Settings -->
        <Button
          variant="ghost"
          size="sm"
          class="h-8 px-3 text-xs"
          :class="{ 'bg-accent': activeSection === 'settings' }"
        >
          <Settings class="w-3 h-3 mr-1.5" />
          Settings
        </Button>

        <!-- Separator -->
        <div class="w-px h-6 bg-border mx-2"></div>

        <!-- Theme Toggle -->
        <Button
          variant="ghost"
          size="sm"
          @click="toggleColorMode"
          aria-label="Toggle theme"
          class="h-8 w-8 p-0"
        >
          <Sun
            v-if="colorMode.value === 'dark'"
            class="h-3 w-3"
          />
          <Moon
            v-else
            class="h-3 w-3"
          />
        </Button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Button } from "@nvisy/shared/ui/button";
import {
	FolderOpen,
	ChevronDown,
	FileText,
	Puzzle,
	Settings,
	Sun,
	Moon,
} from "lucide-vue-next";

// Composables
const colorMode = useColorMode();

// Current project data
const currentProject = ref({
	name: "My Project",
	id: "project-1",
});

// Active section tracking
const activeSection = ref<string>("documents");

// Theme toggle
const toggleColorMode = () => {
	colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

// Handle project selection (placeholder)
const selectProject = () => {
	// TODO: Show project selection dropdown
	console.log("Project selection clicked");
};

// Handle navigation
const navigateTo = (section: string) => {
	activeSection.value = section;
	// TODO: Implement actual navigation
	console.log(`Navigate to ${section}`);
};
</script>
