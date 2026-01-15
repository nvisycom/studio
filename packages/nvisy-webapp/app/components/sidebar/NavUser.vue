<script setup lang="ts">
import { ref } from "vue";
import {
	ChevronsUpDown,
	LogOut,
	Command,
	Moon,
	Sun,
	Home,
	ExternalLink,
	User,
	Key,
} from "lucide-vue-next";
import { EntityAvatar } from "@/components/common";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Kbd } from "@/components/ui/kbd";
import CommandMenu from "@/components/CommandMenu.vue";
import CreateWorkspaceModal from "@/components/sidebar/CreateWorkspaceModal.vue";
import HelpChat from "@/components/HelpChat.vue";

const props = defineProps<{
	user: {
		name: string;
		email: string;
		avatar: string;
	};
}>();

const { t } = useI18n();
const { getKbdKey } = useKbd();
const { isMobile } = useSidebar();
const { logout } = useAuth();

const isCommandMenuOpen = ref(false);
const isCreateWorkspaceOpen = ref(false);
const helpChatRef = ref();
const colorMode = useColorMode();

function openCommandMenu() {
	isCommandMenuOpen.value = true;
}

function toggleTheme() {
	colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}

function handleLogout() {
	logout();
}

// Command menu action handlers
function handleCreateWorkspace() {
	isCreateWorkspaceOpen.value = true;
}

function handleUploadFile() {
	// Navigate to files page where upload can be triggered
	navigateTo("/files");
}

function handleOpenSupport() {
	helpChatRef.value?.toggleChat();
}

// Global keyboard shortcut for opening command menu
defineShortcuts({
	meta_k: () => {
		isCommandMenuOpen.value = !isCommandMenuOpen.value;
	},
});
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent/50"
          >
            <EntityAvatar
              :src="user.avatar"
              :name="user.name"
              size="sm"
              class="rounded-md"
            />
            <div class="grid flex-1 text-left leading-tight">
              <span
                class="truncate text-sm font-medium text-sidebar-foreground"
                >{{ user.name }}</span
              >
              <span class="truncate text-xs text-sidebar-foreground/60">{{
                user.email
              }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4 text-sidebar-foreground/50" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuGroup>
            <DropdownMenuItem as-child>
              <NuxtLink
                to="/account/general"
                class="cursor-pointer flex items-center"
              >
                <User />
                {{ t("commandMenu.account.profile") }}
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuItem as-child>
              <NuxtLink
                to="/account/tokens"
                class="cursor-pointer flex items-center"
              >
                <Key />
                {{ t("commandMenu.account.tokens") }}
              </NuxtLink>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem class="cursor-pointer" @click="openCommandMenu">
              <Command />
              {{ t("commandMenu.title") }}
              <div class="ml-auto flex items-center gap-1">
                <Kbd>{{ getKbdKey("meta") }}</Kbd>
                <Kbd>K</Kbd>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem class="cursor-pointer" @click="toggleTheme">
              <Sun v-if="colorMode.value === 'dark'" />
              <Moon v-else />
              {{ t("commandMenu.actions.toggleTheme") }}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem as-child>
              <a
                href="https://nvisy.com"
                target="_blank"
                rel="noopener noreferrer"
                class="cursor-pointer flex items-center"
              >
                <Home />
                {{ t("commandMenu.homePage") }}
                <ExternalLink :size="12" class="ml-auto opacity-60" />
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem class="cursor-pointer" @click="handleLogout">
              <LogOut />
              {{ t("commandMenu.account.logout") }}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>

  <!-- Command Menu -->
  <CommandMenu
    v-model:open="isCommandMenuOpen"
    @create-workspace="handleCreateWorkspace"
    @upload-file="handleUploadFile"
    @open-support="handleOpenSupport"
  />

  <!-- Create Workspace Modal -->
  <CreateWorkspaceModal v-model:open="isCreateWorkspaceOpen" />

  <!-- Help Chat -->
  <HelpChat ref="helpChatRef" />
</template>
