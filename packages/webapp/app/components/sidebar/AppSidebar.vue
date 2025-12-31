<script setup lang="ts">
import { ref } from "vue";
import type { SidebarProps } from "@/components/ui/sidebar";
import {
	Puzzle,
	Settings,
	Users,
	CreditCard,
	BarChart3,
	MessagesSquare,
	LayoutDashboard,
	Sparkles,
	FolderOpen,
	FileSearch,
	Compass,
} from "lucide-vue-next";
import NavMain from "@/components/sidebar/NavMain.vue";
import NavUser from "@/components/sidebar/NavUser.vue";
import WorkspaceSwitcher from "@/components/sidebar/WorkspaceSwitcher.vue";
import HelpChat from "@/components/help/HelpChat.vue";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "@/components/ui/sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const props = withDefaults(defineProps<SidebarProps>(), {
	collapsible: "icon",
});

const { state } = useSidebar();
const helpChatRef = ref();

// Get authenticated user data
const { user } = useAuth();

// Check if workspace is selected
const { currentWorkspaceId } = useWorkspaces();
const hasWorkspace = computed(() => !!currentWorkspaceId.value);

const userData = computed(() => ({
	name: user.value?.name || "Guest",
	email: user.value?.email || "",
	avatar: "",
}));

// Navigation data
const data = {
	navDashboard: {
		title: "Dashboard",
		url: "/",
		icon: LayoutDashboard,
	},
	navWorkspace: [
		{
			title: "Files",
			url: "/files",
			icon: FolderOpen,
			isActive: false,
		},
		{
			title: "Knowledge",
			url: "/knowledge",
			icon: Sparkles,
			isActive: false,
		},
		{
			title: "Team",
			url: "/team",
			icon: Users,
			isActive: false,
		},
	],
	navAutomation: [
		{
			title: "Integrations",
			url: "/integrations",
			icon: Puzzle,
			isActive: false,
		},
		{
			title: "Explore",
			url: "/integrations/explore",
			icon: Compass,
			isActive: false,
		},
	],
	navObservability: [
		{
			title: "Analytics",
			url: "/analytics",
			icon: BarChart3,
			isActive: false,
		},
		{
			title: "Logs",
			url: "/analytics/logs",
			icon: FileSearch,
			isActive: false,
		},
	],
};

function openHelpChat() {
	helpChatRef.value?.toggleChat();
}
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <WorkspaceSwitcher />
    </SidebarHeader>
    <SidebarContent>
      <!-- Overview - only visible when workspace is selected -->
      <SidebarMenu v-if="hasWorkspace" class="px-2 pt-2">
        <SidebarMenuItem>
          <SidebarMenuButton as-child :tooltip="'Overview'">
            <NuxtLink to="/">
              <LayoutDashboard />
              <span>Overview</span>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <NavMain
        :items="data.navWorkspace"
        label="Workspace"
        :disabled="!hasWorkspace"
      />
      <NavMain
        :items="data.navAutomation"
        label="Automation"
        :disabled="!hasWorkspace"
      />
      <NavMain
        :items="data.navObservability"
        label="Observability"
        :disabled="!hasWorkspace"
      />
    </SidebarContent>
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem
          :class="{ 'opacity-50 pointer-events-none': !hasWorkspace }"
        >
          <SidebarMenuButton as-child>
            <NuxtLink v-if="hasWorkspace" to="/billing">
              <CreditCard />
              <span>Billing</span>
            </NuxtLink>
            <span v-else class="flex items-center gap-2 cursor-not-allowed">
              <CreditCard />
              <span>Billing</span>
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem
          :class="{ 'opacity-50 pointer-events-none': !hasWorkspace }"
        >
          <SidebarMenuButton as-child>
            <NuxtLink v-if="hasWorkspace" to="/settings">
              <Settings />
              <span>Settings</span>
            </NuxtLink>
            <span v-else class="flex items-center gap-2 cursor-not-allowed">
              <Settings />
              <span>Settings</span>
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton @click="openHelpChat">
            <MessagesSquare />
            <span>Support</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <NavUser :user="userData" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>

  <!-- Help Chat Popup -->
  <HelpChat ref="helpChatRef" />
</template>
