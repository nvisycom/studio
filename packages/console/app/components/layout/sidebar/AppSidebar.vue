<script setup lang="ts">
import { Settings, CreditCard, MessagesSquare } from "@lucide/vue";
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
	SidebarSeparator,
	useSidebar,
} from "#console/components/ui/sidebar";

// This shell sidebar takes no props of its own — it's always the icon-
// collapsible dashboard sidebar. Any attrs a caller sets fall through to
// <Sidebar>. (Declaring the props here would force a type-import that
// @vue/compiler-sfc can't resolve via `#console` from inside the layer.)
const { t } = useI18n();
const { state } = useSidebar();
const { open: openHelpChat } = useHelpChat();
const { has } = useFeatures();
const { wLink } = useWorkspaceLink();

// Navigation is defined once in useNavigation and shared with the command menu,
// so a route added there appears in both. The sidebar renders the three labeled
// groups via NavMain; Overview leads on its own, and the settings group (billing
// / settings) plus support live in the footer below.
const { overview, groups, hasWorkspace } = useNavigation();
const navGroup = (id: string) =>
	computed(() => groups.value.find((g) => g.id === id)?.items ?? []);
const navWorkspace = navGroup("workspace");
const navAutomation = navGroup("automation");
const navObservability = navGroup("observability");
// A NavMain group is greyed when every item in it is gated off.
const allDisabled = (items: { disabled?: boolean }[]) =>
	items.length > 0 && items.every((i) => i.disabled);
</script>

<template>
  <Sidebar collapsible="icon" variant="inset">
    <SidebarHeader class="h-[calc(2.75rem-1px)] p-2 justify-center">
      <WorkspaceSwitcher />
    </SidebarHeader>
    <!-- Match the content header's `border-b border-border/50` weight so the two
         top dividers read as one continuous line across the sidebar/content
         seam (the default separator is full-opacity, a touch heavier). -->
    <SidebarSeparator class="bg-border/50" />
    <SidebarContent>
      <!-- Overview - always visible -->
      <SidebarMenu v-if="state === 'expanded'" class="px-2">
        <SidebarMenuItem>
          <SidebarMenuButton as-child :tooltip="overview.title">
            <NuxtLink :to="overview.url">
              <component :is="overview.icon" />
              <span>{{ overview.title }}</span>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <NavMain
        :items="navWorkspace"
        :label="t('sidebar.workspace')"
        :disabled="allDisabled(navWorkspace)"
      />
      <NavMain
        :items="navAutomation"
        :label="t('sidebar.automation')"
        :disabled="allDisabled(navAutomation)"
      />
      <NavMain
        :items="navObservability"
        :label="t('sidebar.observability')"
        :disabled="allDisabled(navObservability)"
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
      <!-- Vertical padding keeps the account button's hover fill from butting
           against the separator above it (the fill is a rounded rect spanning
           the row; flush against the 1px line it read as the line cutting through
           the highlight). -->
      <div class="px-2 py-1.5 flex items-center">
        <NavUser />
      </div>
    </SidebarFooter>
  </Sidebar>

  <!-- Help Chat Popup -->
  <HelpChat v-if="has('support')" />
</template>
