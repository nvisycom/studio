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
import { truncate } from "@/utils/naming";
import CreateWorkspaceModal from "./CreateWorkspaceModal.vue";

const { t } = useI18n();
const { isMobile } = useSidebar();

const MAX_NAME_LENGTH = 18;

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
            />
            <div
              v-else
              class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
            >
              <Layers class="size-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">
                {{
                  currentWorkspace
                    ? truncate(currentWorkspace.displayName, MAX_NAME_LENGTH)
                    : t("workspace.select")
                }}
              </span>
              <span
                v-if="currentWorkspace?.description"
                class="truncate text-sm font-normal"
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
            class="flex items-center gap-2 px-2 py-1 mb-1.5 rounded-md cursor-pointer"
            :class="
              workspace.workspaceId === currentWorkspaceId ? 'bg-accent' : ''
            "
            @click="handleSelectWorkspace(workspace.workspaceId)"
          >
            <EntityAvatar :name="workspace.displayName" size="sm" />
            <div class="flex flex-col flex-1 min-w-0">
              <span class="truncate text-sm">{{
                truncate(workspace.displayName, MAX_NAME_LENGTH)
              }}</span>
              <span class="text-xs font-normal text-muted-foreground">
                {{ t(`members.roles.${workspace.memberRole}`) }}
              </span>
            </div>
            <span
              v-if="index < 9"
              class="ml-auto text-xs tracking-widest text-muted-foreground"
            >
              ⌘{{ index + 1 }}
            </span>
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
