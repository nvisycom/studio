<script setup lang="ts">
import { ChevronsUpDown, Plus, Layers } from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { EntityAvatar } from "@/components/common";
import CreateWorkspaceModal from "./CreateWorkspaceModal.vue";

const { t } = useI18n();
const { isMobile } = useSidebar();

// Use the workspaces composable
const {
  workspaces,
  currentWorkspace,
  currentWorkspaceId,
  selectWorkspace,
  isLoading,
} = useWorkspaces();

const isCreateWorkspaceModalOpen = ref(false);

function handleSelectWorkspace(workspaceId: string) {
  selectWorkspace(workspaceId);
}
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
            <EntityAvatar
              v-if="currentWorkspace"
              :name="currentWorkspace.displayName"
              size="md"
              fallback-from="#6366F1"
              fallback-to="#8B5CF6"
            />
            <div
              v-else
              class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
            >
              <Layers class="size-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">
                {{ currentWorkspace?.displayName ?? t("workspace.select") }}
              </span>
              <span
                v-if="currentWorkspace?.description"
                class="truncate text-sm font-light"
              >
                {{ currentWorkspace.description }}
              </span>
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
            :key="workspace.workspaceId"
            class="gap-2 p-2"
            :class="{
              'bg-accent': workspace.workspaceId === currentWorkspaceId,
            }"
            @click="handleSelectWorkspace(workspace.workspaceId)"
          >
            <EntityAvatar
              :name="workspace.displayName"
              size="sm"
              fallback-from="#6366F1"
              fallback-to="#8B5CF6"
            />
            <span class="truncate">{{ workspace.displayName }}</span>
            <DropdownMenuShortcut v-if="index < 9">
              ⌘{{ index + 1 }}
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="workspaces && workspaces.length > 0" />
          <DropdownMenuItem
            class="gap-2 p-2"
            @click="isCreateWorkspaceModalOpen = true"
          >
            <div
              class="flex size-6 items-center justify-center rounded-md border bg-background"
            >
              <Plus class="size-4" />
            </div>
            <div class="font-normal text-muted-foreground">
              {{ t("workspace.addWorkspace") }}
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>

    <CreateWorkspaceModal v-model:open="isCreateWorkspaceModalOpen" />
  </SidebarMenu>
</template>
