<script setup lang="ts">
// Relative (not `#console`) so @vue/compiler-sfc can resolve the type when
// extracting `defineProps` runtime props — its type resolver can't follow the
// Nuxt `#console` alias for a file that lives inside the layer itself.
import type { SidebarProps } from "../../ui/sidebar";
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
	PenTool,
	Workflow,
	ShieldCheck,
} from "@lucide/vue";
import NavMain from "#console/components/layout/sidebar/NavMain.vue";
import NavUser from "#console/components/layout/sidebar/NavUser.vue";
import WorkspaceSwitcher from "#console/components/layout/sidebar/WorkspaceSwitcher.vue";
import HelpChat from "#console/components/layout/HelpChat.vue";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
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
const { has } = useFeatures();
const { wLink } = useWorkspaceLink();

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
		url: wLink("/files"),
		icon: FolderOpen,
		isActive: false,
	},
	{
		title: t("sidebar.studio"),
		url: wLink("/studio"),
		icon: PenTool,
		isActive: false,
	},
	{
		title: t("sidebar.team"),
		url: wLink("/team"),
		icon: Users,
		isActive: false,
	},
]);

const navAutomation = computed(() => [
	{
		title: t("sidebar.workflows"),
		url: wLink("/workflows"),
		icon: Workflow,
		isActive: false,
	},
	{
		title: t("sidebar.connections"),
		url: wLink("/integrations"),
		icon: Puzzle,
		isActive: false,
	},
	{
		title: t("sidebar.policies"),
		url: wLink("/policies"),
		icon: ShieldCheck,
		isActive: false,
	},
]);

const navObservability = computed(() => [
	{
		title: t("sidebar.analytics"),
		url: wLink("/analytics"),
		icon: BarChart3,
		isActive: false,
	},
	{
		title: t("sidebar.logs"),
		url: wLink("/analytics/logs"),
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
            <NuxtLink :to="wLink('/')">
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
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem
            v-if="has('billing')"
            :class="{ 'opacity-50 pointer-events-none': !hasWorkspace }"
          >
            <SidebarMenuButton
              as-child
              :tooltip="hasWorkspace ? t('sidebar.billing') : undefined"
            >
              <NuxtLink v-if="hasWorkspace" :to="wLink('/billing')">
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
              <NuxtLink v-if="hasWorkspace" :to="wLink('/settings/general')">
                <Settings />
                <span>{{ t("sidebar.settings") }}</span>
              </NuxtLink>
              <span v-else class="flex items-center gap-2 cursor-not-allowed">
                <Settings />
                <span>{{ t("sidebar.settings") }}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem v-if="has('support')">
            <SidebarMenuButton
              :tooltip="t('sidebar.support')"
              @click="openHelpChat"
            >
              <MessagesSquare />
              <span>{{ t("sidebar.support") }}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarSeparator />
      <div class="h-[calc(2.75rem-1px)] px-2 flex items-center">
        <NavUser />
      </div>
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>

  <!-- Help Chat Popup -->
  <HelpChat v-if="has('support')" />
</template>
