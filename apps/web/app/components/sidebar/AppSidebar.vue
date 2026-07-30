<script setup lang="ts">
import type { SidebarProps } from "#console/components/ui/sidebar";
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
	Workflow,
} from "@lucide/vue";
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
	SidebarSeparator,
	useSidebar,
} from "#console/components/ui/sidebar";

const props = withDefaults(defineProps<SidebarProps>(), {
	collapsible: "icon",
});

const { t } = useI18n();
const { state } = useSidebar();
const { open: openHelpChat } = useHelpChat();

// Check if workspace is selected and get current role
const { currentWorkspaceSlug, currentWorkspace } = useWorkspaces();
const hasWorkspace = computed(() => !!currentWorkspaceSlug.value);
const isAdminOrOwner = computed(() => {
	const role = currentWorkspace.value?.memberRole;
	return role === "owner" || role === "admin";
});

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
		title: t("sidebar.workflows"),
		url: "/workflows",
		icon: Workflow,
		isActive: false,
	},
	{
		title: t("sidebar.connections"),
		url: "/connections",
		icon: Puzzle,
		isActive: false,
	},
	{
		title: t("sidebar.explore"),
		url: "/connections/explore",
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
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader class="h-[calc(2.75rem-1px)] p-2 justify-center">
      <WorkspaceSwitcher />
    </SidebarHeader>
    <SidebarSeparator />
    <SidebarContent>
      <!-- Overview - always visible -->
      <SidebarMenu v-if="state === 'expanded'" class="px-2">
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
    <SidebarFooter class="gap-0 p-0">
      <SidebarSeparator />
      <div class="p-2">
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
      </div>
      <SidebarSeparator />
      <div class="h-[calc(2.75rem-1px)] px-2 flex items-center">
        <NavUser />
      </div>
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>

  <!-- Help Chat Popup -->
  <HelpChat />
</template>
