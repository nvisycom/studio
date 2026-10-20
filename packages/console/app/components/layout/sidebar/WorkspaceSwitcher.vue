<script setup lang="ts">
import type { Workspace } from "@nvisy/sdk/datatypes";
import { ChevronsUpDown, Plus, Layers, HardDrive } from "@lucide/vue";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "#console/components/ui/sidebar";
import { EntityAvatar } from "#console/components/avatar";
import {
	isLocalWorkspace,
	type WorkspaceWithOrigin,
} from "#console/repositories/types";
import { truncate } from "#console/utils/naming";

const { t } = useI18n();
const { isMobile } = useSidebar();

const MAX_NAME_LENGTH = 18;

// Use the workspaces composable
const { workspaces, currentWorkspace, currentWorkspaceSlug, selectWorkspace } =
	useWorkspaces();
const { resolveAvatarUrl } = useAvatarUrl();
// The create-workspace sheet is a shell-wide singleton (mounted in the layout).
const { open: openCreateWorkspace } = useCreateWorkspace();

// Split the list by origin so local folder-workspaces read distinctly from
// server ones — their own section, a drive glyph, and the folder path instead of
// a membership role (which a local workspace doesn't have).
const localWorkspaces = computed(() =>
	(workspaces.value ?? []).filter((w) => isLocalWorkspace(w)),
);
const serverWorkspaces = computed(() =>
	(workspaces.value ?? []).filter((w) => !isLocalWorkspace(w)),
);
const currentIsLocal = computed(() => isLocalWorkspace(currentWorkspace.value));

/** A local workspace's folder path, shortened for the row subtitle. */
function folderPath(workspace: Workspace): string {
	const folder = (workspace as WorkspaceWithOrigin).folder ?? "";
	// Show the last two path segments, prefixed with … when there's more.
	const parts = folder.split(/[/\\]/).filter(Boolean);
	if (parts.length <= 2) return folder;
	return `…/${parts.slice(-2).join("/")}`;
}
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
            <!-- Local workspace → a drive glyph (no avatar); server → its avatar;
                 none selected → the generic layers mark. -->
            <div
              v-if="currentIsLocal"
              class="-ml-1 flex aspect-square size-7 items-center justify-center rounded-md bg-sidebar-foreground/10 group-data-[collapsible=icon]:ml-0!"
            >
              <HardDrive class="size-3.5 text-sidebar-foreground/70" />
            </div>
            <EntityAvatar
              v-else-if="currentWorkspace"
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
          <!-- Local folder-workspaces: their own section, a drive glyph, and the
               folder path instead of a role. -->
          <template v-if="localWorkspaces.length > 0">
            <DropdownMenuLabel
              class="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground"
            >
              {{ t("workspace.localGroup") }}
            </DropdownMenuLabel>
            <DropdownMenuItem
              v-for="workspace in localWorkspaces"
              :key="workspace.handle"
              class="flex items-center gap-2 px-2 py-1.5 mb-0.5 rounded-md cursor-pointer"
              :class="workspace.handle === currentWorkspaceSlug ? 'bg-accent' : ''"
              @click="selectWorkspace(workspace.handle)"
            >
              <div
                class="flex aspect-square size-7 items-center justify-center rounded-md bg-muted"
              >
                <HardDrive class="size-3.5 text-muted-foreground" />
              </div>
              <div class="flex flex-col flex-1 min-w-0">
                <span class="truncate text-sm">{{
                  truncate(workspace.displayName, MAX_NAME_LENGTH)
                }}</span>
                <span class="truncate text-xs text-muted-foreground font-mono">
                  {{ folderPath(workspace) }}
                </span>
              </div>
            </DropdownMenuItem>
          </template>

          <!-- Server workspaces. -->
          <template v-if="serverWorkspaces.length > 0">
            <DropdownMenuLabel
              class="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground"
            >
              {{ t("workspace.serverGroup") }}
            </DropdownMenuLabel>
            <DropdownMenuItem
              v-for="workspace in serverWorkspaces"
              :key="workspace.handle"
              class="flex items-center gap-2 px-2 py-1.5 mb-0.5 rounded-md cursor-pointer"
              :class="workspace.handle === currentWorkspaceSlug ? 'bg-accent' : ''"
              @click="selectWorkspace(workspace.handle)"
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
          </template>

          <DropdownMenuSeparator v-if="workspaces && workspaces.length > 0" />
          <DropdownMenuItem
            class="gap-2 px-2 py-1.5"
            @click="openCreateWorkspace"
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
  </SidebarMenu>
</template>
