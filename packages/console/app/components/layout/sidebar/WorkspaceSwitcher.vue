<script setup lang="ts">
import { ChevronsUpDown, Plus, Layers } from "@lucide/vue";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "#console/components/ui/sidebar";
import { EntityAvatar } from "#console/components/common";
import { truncate } from "#console/utils/naming";
import CreateWorkspaceSheet from "#console/components/common/CreateWorkspaceSheet.vue";

const { t } = useI18n();
const { isMobile } = useSidebar();

const MAX_NAME_LENGTH = 18;

// Use the workspaces composable
const { workspaces, currentWorkspace, currentWorkspaceSlug, selectWorkspace } =
	useWorkspaces();
const { resolveAvatarUrl } = useAvatarUrl();

const isCreateWorkspaceSheetOpen = ref(false);
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent/50 group-data-[collapsible=icon]:justify-center"
          >
            <EntityAvatar
              v-if="currentWorkspace"
              :name="currentWorkspace.displayName"
              :src="resolveAvatarUrl(currentWorkspace.avatarUrl)"
              size="sm"
              class="-ml-1 rounded-md group-data-[collapsible=icon]:ml-0!"
            />
            <div
              v-else
              class="flex aspect-square size-7 items-center justify-center rounded-md bg-sidebar-foreground/10"
            >
              <Layers class="size-3.5 text-sidebar-foreground/70" />
            </div>
            <div
              class="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden"
            >
              <span
                class="truncate text-sm font-medium text-sidebar-foreground"
              >
                {{
                  currentWorkspace
                    ? truncate(currentWorkspace.displayName, MAX_NAME_LENGTH)
                    : t("workspace.select")
                }}
              </span>
              <span
                v-if="currentWorkspace?.description"
                class="truncate text-xs text-sidebar-foreground/60"
              >
                {{ currentWorkspace.description }}
              </span>
            </div>
            <ChevronsUpDown
              class="ml-auto size-4 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden"
            />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          align="start"
          :side="isMobile ? 'bottom' : 'right'"
          :side-offset="4"
        >
          <DropdownMenuItem
            v-for="workspace in workspaces"
            :key="workspace.slug"
            class="flex items-center gap-2 px-2 py-1.5 mb-0.5 rounded-md cursor-pointer"
            :class="
              workspace.slug === currentWorkspaceSlug ? 'bg-accent' : ''
            "
            @click="selectWorkspace(workspace.slug)"
          >
            <EntityAvatar
              :name="workspace.displayName"
              :src="resolveAvatarUrl(workspace.avatarUrl)"
              size="sm"
              class="rounded-md"
            />
            <div class="flex flex-col flex-1 min-w-0">
              <span class="truncate text-sm">{{
                truncate(workspace.displayName, MAX_NAME_LENGTH)
              }}</span>
              <span class="text-xs text-muted-foreground">
                {{ t(`members.roles.${workspace.memberRole}`) }}
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="workspaces && workspaces.length > 0" />
          <DropdownMenuItem
            class="gap-2 px-2 py-1.5"
            @click="isCreateWorkspaceSheetOpen = true"
          >
            <div
              class="flex size-5 items-center justify-center rounded border bg-background"
            >
              <Plus class="size-3" />
            </div>
            <span class="text-sm text-muted-foreground">
              {{ t("workspace.addWorkspace") }}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>

    <CreateWorkspaceSheet v-model:open="isCreateWorkspaceSheetOpen" />
  </SidebarMenu>
</template>
