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
import CommandMenu from "@/components/CommandMenu.vue";

const props = defineProps<{
	user: {
		name: string;
		email: string;
		avatar: string;
	};
}>();

const { isMobile } = useSidebar();
const { logout } = useAuth();

const isCommandMenuOpen = ref(false);
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
            <EntityAvatar :src="user.avatar" :name="user.name" size="md" />
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ user.name }}</span>
              <span class="truncate text-sm font-light">{{ user.email }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
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
                Account Settings
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuItem as-child>
              <NuxtLink
                to="/account/tokens"
                class="cursor-pointer flex items-center"
              >
                <Key />
                API Tokens
              </NuxtLink>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem @click="openCommandMenu" class="cursor-pointer">
              <Command />
              Command Menu
              <span
                class="ml-auto text-sm font-light text-neutral-500 dark:text-neutral-400"
                >⌘K</span
              >
            </DropdownMenuItem>
            <DropdownMenuItem @click="toggleTheme" class="cursor-pointer">
              <Sun v-if="colorMode.value === 'dark'" />
              <Moon v-else />
              Toggle Theme
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
                Home Page
                <ExternalLink :size="12" class="ml-auto opacity-60" />
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleLogout" class="cursor-pointer">
              <LogOut />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>

  <!-- Command Menu -->
  <CommandMenu v-model:open="isCommandMenuOpen" />
</template>
