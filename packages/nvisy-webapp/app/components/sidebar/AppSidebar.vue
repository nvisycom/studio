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
	FolderOpen,
	FileSearch,
	Compass,
	PenTool,
} from "lucide-vue-next";
import NavMain from "@/components/sidebar/NavMain.vue";
import NavUser from "@/components/sidebar/NavUser.vue";
import WorkspaceSwitcher from "@/components/sidebar/WorkspaceSwitcher.vue";
import HelpChat from "@/components/HelpChat.vue";
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

const { t } = useI18n();
const { state } = useSidebar();
const helpChatRef = ref();

// Get authenticated user data
const { displayName, emailAddress } = useAccount();

// Check if workspace is selected and get current role
const { currentWorkspaceId, currentWorkspace } = useWorkspaces();
const hasWorkspace = computed(() => !!currentWorkspaceId.value);
const isAdminOrOwner = computed(() => {
	const role = currentWorkspace.value?.memberRole;
	return role === "owner" || role === "admin";
});

const userData = computed(() => ({
	name: displayName.value || "Guest",
	email: emailAddress.value || "",
	avatar: "",
}));

// Navigation data
const navWorkspace = computed(() => [
	{
		title: t("sidebar.files"),
		url: "/files",
		icon: FolderOpen,
		isActive: false,
	},
	{
		title: t("sidebar.studio"),
		url: "/studio",
		icon: PenTool,
		isActive: false,
	},
	{
		title: t("sidebar.team"),
		url: "/team",
		icon: Users,
		isActive: false,
	},
]);

const navAutomation = computed(() => [
	{
		title: t("sidebar.integrations"),
		url: "/integrations",
		icon: Puzzle,
		isActive: false,
	},
	{
		title: t("sidebar.explore"),
		url: "/integrations/explore",
		icon: Compass,
		isActive: false,
	},
]);

const navObservability = computed(() => [
	{
		title: t("sidebar.analytics"),
		url: "/analytics",
		icon: BarChart3,
		isActive: false,
	},
	{
		title: t("sidebar.logs"),
		url: "/analytics/logs",
		icon: FileSearch,
		isActive: false,
	},
]);

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
      <!-- Overview - always visible -->
      <SidebarMenu v-if="state === 'expanded'" class="px-2 pt-2">
        <SidebarMenuItem>
          <SidebarMenuButton as-child :tooltip="t('sidebar.overview')">
            <NuxtLink to="/">
              <LayoutDashboard />
              <span>{{ t("sidebar.overview") }}</span>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <NavMain
        :items="navWorkspace"
        :label="t('sidebar.workspace')"
        :disabled="!hasWorkspace"
      />
      <NavMain
        :items="navAutomation"
        :label="t('sidebar.automation')"
        :disabled="!hasWorkspace || !isAdminOrOwner"
      />
      <NavMain
        :items="navObservability"
        :label="t('sidebar.observability')"
        :disabled="!hasWorkspace"
      />
    </SidebarContent>
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem
          :class="{ 'opacity-50 pointer-events-none': !hasWorkspace }"
        >
          <SidebarMenuButton
            as-child
            :tooltip="hasWorkspace ? t('sidebar.billing') : undefined"
          >
            <NuxtLink v-if="hasWorkspace" to="/billing">
              <CreditCard />
              <span>{{ t("sidebar.billing") }}</span>
            </NuxtLink>
            <span v-else class="flex items-center gap-2 cursor-not-allowed">
              <CreditCard />
              <span>{{ t("sidebar.billing") }}</span>
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem
          :class="{ 'opacity-50 pointer-events-none': !hasWorkspace }"
        >
          <SidebarMenuButton
            as-child
            :tooltip="hasWorkspace ? t('sidebar.settings') : undefined"
          >
            <NuxtLink v-if="hasWorkspace" to="/settings/general">
              <Settings />
              <span>{{ t("sidebar.settings") }}</span>
            </NuxtLink>
            <span v-else class="flex items-center gap-2 cursor-not-allowed">
              <Settings />
              <span>{{ t("sidebar.settings") }}</span>
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            :tooltip="t('sidebar.support')"
            @click="openHelpChat"
          >
            <MessagesSquare />
            <span>{{ t("sidebar.support") }}</span>
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
