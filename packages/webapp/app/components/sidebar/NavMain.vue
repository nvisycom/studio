<script setup lang="ts">
import type { LucideIcon } from "lucide-vue-next";
import { ChevronRight } from "lucide-vue-next";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface NavSubItem {
	title: string;
	url: string;
}

interface NavItem {
	title: string;
	url: string;
	icon?: LucideIcon;
	isActive?: boolean;
	items?: NavSubItem[];
}

withDefaults(
	defineProps<{
		items: NavItem[];
		label?: string;
	}>(),
	{
		label: "Platform",
	},
);
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel v-if="label" class="uppercase">{{
      label
    }}</SidebarGroupLabel>
    <SidebarMenu>
      <Collapsible
        v-for="item in items"
        :key="item.title"
        as-child
        :default-open="item.isActive"
        class="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger v-if="item.items" as-child>
            <SidebarMenuButton :tooltip="item.title">
              <component :is="item.icon" v-if="item.icon" />
              <span>{{ item.title }}</span>
              <ChevronRight
                class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <SidebarMenuButton v-else :tooltip="item.title" as-child>
            <NuxtLink :to="item.url">
              <component :is="item.icon" v-if="item.icon" />
              <span>{{ item.title }}</span>
            </NuxtLink>
          </SidebarMenuButton>
          <CollapsibleContent v-if="item.items">
            <SidebarMenuSub>
              <SidebarMenuSubItem
                v-for="subItem in item.items"
                :key="subItem.title"
              >
                <SidebarMenuSubButton as-child>
                  <NuxtLink :to="subItem.url">
                    <span>{{ subItem.title }}</span>
                  </NuxtLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>
