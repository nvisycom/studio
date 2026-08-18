<script setup lang="ts">
import {
	ChevronsUpDown,
	LogOut,
	Command,
	Moon,
	Sun,
	Monitor,
	Home,
	BookOpen,
	Languages,
	ExternalLink,
	User,
	Key,
} from "@lucide/vue";
import { EntityAvatar } from "#console/components/common";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "#console/components/ui/sidebar";
import { Kbd } from "#console/components/ui/kbd";
import { personLabel } from "#console/utils/naming";
import CommandMenu from "#console/components/layout/CommandMenu.vue";
import CreateWorkspaceSheet from "#console/components/common/CreateWorkspaceSheet.vue";

const { t, locale, locales, setLocale } = useI18n();
const { wLink } = useWorkspaceLink();

// Language submenu: show the active locale inline, switch on select.
type LocaleCode = "en" | "de";
const currentLocale = computed(() =>
	locales.value.find((l) => l.code === locale.value),
);
function switchLocale(code: LocaleCode) {
	setLocale(code);
}
const { getKbdKey } = useKbd();
const { isMobile } = useSidebar();
const { logout } = useAuth();
const { displayName, username, emailAddress, avatarUrl } = useAccount();
const { resolveAvatarUrl } = useAvatarUrl();

const avatarSrc = computed(() => resolveAvatarUrl(avatarUrl.value));

// Primary label uses the shared person fallback (display name → username →
// email). The email shows as the subtitle whenever it isn't already the
// primary label (i.e. as long as a display name or username is present).
const primaryLabel = computed(() =>
	personLabel({
		displayName: displayName.value,
		username: username.value,
		emailAddress: emailAddress.value,
	}),
);
const secondaryLabel = computed(() =>
	displayName.value || username.value ? (emailAddress.value ?? "") : "",
);

const { open: openHelpChat } = useHelpChat();
const isCommandMenuOpen = ref(false);
const isCreateWorkspaceOpen = ref(false);
const colorMode = useColorMode();

function openCommandMenu() {
	isCommandMenuOpen.value = true;
}

// Theme submenu: a three-way choice (light / dark / system) bound to the
// color-mode preference.
const themeOptions = [
	{ value: "light", icon: Sun, labelKey: "userMenu.themeLight" },
	{ value: "dark", icon: Moon, labelKey: "userMenu.themeDark" },
	{ value: "system", icon: Monitor, labelKey: "userMenu.themeSystem" },
] as const;
const themePreference = computed({
	get: () => colorMode.preference,
	set: (value: string) => {
		colorMode.preference = value;
	},
});
const activeThemeLabel = computed(
	() =>
		themeOptions.find((o) => o.value === colorMode.preference)?.labelKey ??
		"userMenu.themeSystem",
);

function handleLogout() {
	logout();
}

// Command menu action handlers
function handleCreateWorkspace() {
	isCreateWorkspaceOpen.value = true;
}

function handleUploadFile() {
	// Navigate to files page where upload can be triggered
	navigateTo(wLink("/files"));
}

function handleOpenSupport() {
	openHelpChat();
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
            class="data-[state=open]:bg-sidebar-accent/50 group-data-[collapsible=icon]:justify-center"
          >
            <EntityAvatar
              :name="primaryLabel"
              :src="avatarSrc"
              size="sm"
              class="-ml-1 rounded-md group-data-[collapsible=icon]:ml-0!"
            />
            <div
              class="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden"
            >
              <span
                class="truncate text-sm font-medium text-sidebar-foreground"
                >{{ primaryLabel }}</span
              >
              <span
                v-if="secondaryLabel"
                class="truncate text-xs text-sidebar-foreground/60"
                >{{ secondaryLabel }}</span
              >
            </div>
            <ChevronsUpDown
              class="ml-auto size-4 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden"
            />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
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
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Languages />
                {{ t("userMenu.language") }}
                <span class="ml-auto text-xs uppercase text-muted-foreground">
                  {{ currentLocale?.code }}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  :model-value="locale"
                  @update:model-value="switchLocale($event as LocaleCode)"
                >
                  <DropdownMenuRadioItem
                    v-for="loc in locales"
                    :key="loc.code"
                    :value="loc.code"
                    class="cursor-pointer"
                  >
                    {{ loc.name }}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun v-if="colorMode.preference === 'light'" />
                <Moon v-else-if="colorMode.preference === 'dark'" />
                <Monitor v-else />
                {{ t("userMenu.theme") }}
                <span class="ml-auto text-xs text-muted-foreground">
                  {{ t(activeThemeLabel) }}
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup v-model="themePreference">
                  <DropdownMenuRadioItem
                    v-for="option in themeOptions"
                    :key="option.value"
                    :value="option.value"
                    class="cursor-pointer"
                  >
                    <component :is="option.icon" :size="16" />
                    {{ t(option.labelKey) }}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
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
            <DropdownMenuItem as-child>
              <a
                href="https://docs.nvisy.com"
                target="_blank"
                rel="noopener noreferrer"
                class="cursor-pointer flex items-center"
              >
                <BookOpen />
                {{ t("userMenu.documentation") }}
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
  <CreateWorkspaceSheet v-model:open="isCreateWorkspaceOpen" />
</template>
