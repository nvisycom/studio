<script setup lang="ts">
import type { Component } from "vue";
import { ChevronsUpDown, Plus, LayoutGrid } from "lucide-vue-next";
import { ref } from "vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import CreateWorkspaceModal from "./CreateWorkspaceModal.vue";

const props = defineProps<{
  workspaces: {
    name: string;
    logo: Component;
    plan: string;
  }[];
}>();

const { isMobile } = useSidebar();
const activeWorkspace = ref(props.workspaces[0]);
const isCreateWorkspaceModalOpen = ref(false);
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div
              class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
            >
              <component :is="activeWorkspace.logo" class="size-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">
                {{ activeWorkspace.name }}
              </span>
              <span class="truncate text-sm font-light">{{
                activeWorkspace.plan
              }}</span>
            </div>
            <ChevronsUpDown class="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="start"
          :side="isMobile ? 'bottom' : 'right'"
          :side-offset="4"
        >
          <DropdownMenuItem
            v-for="(workspace, index) in workspaces"
            :key="workspace.name"
            class="gap-2 p-2"
            @click="activeWorkspace = workspace"
          >
            <div
              class="flex size-6 items-center justify-center rounded-sm border"
            >
              <component :is="workspace.logo" class="size-4 shrink-0" />
            </div>
            {{ workspace.name }}
            <DropdownMenuShortcut>⌘{{ index + 1 }}</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="gap-2 p-2"
            @click="isCreateWorkspaceModalOpen = true"
          >
            <div
              class="flex size-6 items-center justify-center rounded-md border bg-background"
            >
              <Plus class="size-4" />
            </div>
            <div class="font-normal text-muted-foreground">Add workspace</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>

    <CreateWorkspaceModal v-model:open="isCreateWorkspaceModalOpen" />
  </SidebarMenu>
</template>
