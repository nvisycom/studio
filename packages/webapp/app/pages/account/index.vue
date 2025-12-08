<script setup lang="ts">
import { ref, computed } from "vue";
import {
	Search,
	Shield,
	ShieldOff,
	ChevronDown,
	ExternalLink,
	Users,
	Plus,
} from "lucide-vue-next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";

definePageMeta({
	breadcrumbs: [{ label: "Account", href: "/account" }],
});

interface Project {
	id: string;
	name: string;
	url: string;
	gradient: string;
	initials: string;
	memberCount: number;
	has2FA: boolean;
	role: "Owner" | "Editor" | "Member";
	lastAccessed: Date;
}

// Reactive state
const searchQuery = ref("");
const selected2FAFilter = ref("All Projects");

const twoFAFilters = ["All Projects", "2FA Required", "2FA Optional"];

// Mock projects data
const projects = ref<Project[]>([
	{
		id: "1",
		name: "Production App",
		url: "production-app",
		gradient: "bg-gradient-to-br from-blue-500 to-purple-600",
		initials: "PA",
		memberCount: 12,
		has2FA: true,
		role: "Owner",
		lastAccessed: new Date("2024-01-20T10:30:00"),
	},
	{
		id: "2",
		name: "Demo Project",
		url: "demo-project",
		gradient: "bg-gradient-to-br from-green-500 to-teal-600",
		initials: "DP",
		memberCount: 5,
		has2FA: false,
		role: "Editor",
		lastAccessed: new Date("2024-01-19T14:20:00"),
	},
	{
		id: "3",
		name: "Test Environment",
		url: "test-environment",
		gradient: "bg-gradient-to-br from-orange-500 to-red-600",
		initials: "TE",
		memberCount: 3,
		has2FA: true,
		role: "Member",
		lastAccessed: new Date("2024-01-18T09:15:00"),
	},
	{
		id: "4",
		name: "Client Portal",
		url: "client-portal",
		gradient: "bg-gradient-to-br from-purple-500 to-pink-600",
		initials: "CP",
		memberCount: 8,
		has2FA: false,
		role: "Editor",
		lastAccessed: new Date("2024-01-17T16:45:00"),
	},
	{
		id: "5",
		name: "Analytics Dashboard",
		url: "analytics-dashboard",
		gradient: "bg-gradient-to-br from-cyan-500 to-blue-600",
		initials: "AD",
		memberCount: 15,
		has2FA: true,
		role: "Owner",
		lastAccessed: new Date("2024-01-20T11:00:00"),
	},
]);

// Computed filtered projects
const filteredProjects = computed(() => {
	let filtered = projects.value;

	// Apply search filter
	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase();
		filtered = filtered.filter(
			(project) =>
				project.name.toLowerCase().includes(query) ||
				project.url.toLowerCase().includes(query),
		);
	}

	// Apply 2FA filter
	if (selected2FAFilter.value === "2FA Required") {
		filtered = filtered.filter((project) => project.has2FA);
	} else if (selected2FAFilter.value === "2FA Optional") {
		filtered = filtered.filter((project) => !project.has2FA);
	}

	// Sort by last accessed (most recent first)
	return filtered.sort(
		(a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime(),
	);
});

// Functions
function select2FAFilter(filter: string) {
	selected2FAFilter.value = filter;
}

function navigateToProject(projectUrl: string) {
	console.log("Navigating to project:", projectUrl);
	// Implement navigation logic
}

function formatLastAccessed(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));

	if (hours < 1) return "Just now";
	if (hours < 24) return `${hours}h ago`;
	if (days === 1) return "Yesterday";
	if (days < 7) return `${days}d ago`;

	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div class="max-w-7xl mx-auto w-full">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Projects
        </h1>
        <p class="text-neutral-600 dark:text-neutral-400">
          Access and manage all your projects
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6">
        <div class="relative flex-1">
          <Search
            :size="16"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            v-model="searchQuery"
            placeholder="Search projects..."
            class="pl-10"
          />
        </div>

        <!-- 2FA Filter -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="justify-between min-w-[160px]">
              {{ selected2FAFilter }}
              <ChevronDown :size="16" class="ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-[160px]">
            <DropdownMenuItem
              v-for="filter in twoFAFilters"
              :key="filter"
              @click="select2FAFilter(filter)"
            >
              {{ filter }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button class="flex items-center gap-2">
          <Plus :size="16" />
          New Project
        </Button>
      </div>

      <!-- Projects Grid -->
      <div v-if="filteredProjects.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          v-for="project in filteredProjects"
          :key="project.id"
          @click="navigateToProject(project.url)"
          class="group border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg transition-all text-left bg-white dark:bg-neutral-950"
        >
          <div class="flex items-start justify-between mb-4">
            <Avatar class="size-12">
              <AvatarFallback :class="project.gradient" class="text-white font-semibold">
                {{ project.initials }}
              </AvatarFallback>
            </Avatar>
            <div class="flex items-center gap-2">
              <Badge
                v-if="project.has2FA"
                variant="secondary"
                class="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
              >
                <Shield :size="12" class="mr-1" />
                2FA
              </Badge>
              <Badge v-else variant="secondary" class="text-xs">
                <ShieldOff :size="12" class="mr-1" />
                No 2FA
              </Badge>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {{ project.name }}
              </h3>
              <ExternalLink
                :size="14"
                class="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400"
              />
            </div>

            <p class="text-sm text-neutral-600 dark:text-neutral-400 font-mono truncate">
              app.nvisy.com/{{ project.url }}
            </p>

            <div class="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <Users :size="14" />
                <span>{{ project.memberCount }} members</span>
              </div>

              <Badge variant="outline" class="text-xs">
                {{ project.role }}
              </Badge>
            </div>

            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Accessed {{ formatLastAccessed(project.lastAccessed) }}
            </p>
          </div>
        </button>
      </div>

      <!-- Empty State -->
      <Empty v-else class="py-12">
        <EmptyHeader>
          <EmptyTitle>No projects found</EmptyTitle>
          <EmptyDescription>
            {{ searchQuery || selected2FAFilter !== 'All Projects' ? 'Try adjusting your search or filters' : 'Create your first project to get started' }}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent v-if="!searchQuery && selected2FAFilter === 'All Projects'">
          <Button class="flex items-center gap-2">
            <Plus :size="16" />
            Create Your First Project
          </Button>
        </EmptyContent>
      </Empty>
      </div>
  </div>
</template>
