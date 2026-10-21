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
	UserRound,
	Key,
	Plug,
} from "@lucide/vue";
import { EntityAvatar } from "#console/components/avatar";
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

const { t, locale, locales, setLocale } = useI18n();

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
const { logout, isAuthenticated } = useAuth();
const { isDesktop } = usePlatform();
const { displayName, username, emailAddress, avatarUrl } = useAccount();
const { resolveAvatarUrl } = useAvatarUrl();

// The account chip is SESSION-driven, not workspace-driven: with no server
// account (desktop, signed out) it presents an honest "Local" state instead of
// a blank avatar/name, hides the account pages (they need a server), and turns
// "Log out" into "Connect a server" — sign-in is an opt-in. This is about the
// session, independent of whether the active workspace is local or server.
// Reactive, so the menu re-renders the moment a server is connected or left.
const noAccount = computed(() => isDesktop.value && !isAuthenticated.value);

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

const { open: openCommandMenu } = useCommandMenu();
const colorMode = useColorMode();

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
            <div
              v-if="noAccount"
              class="-ml-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-foreground/70 group-data-[collapsible=icon]:ml-0!"
            >
              <UserRound :size="16" />
            </div>
            <EntityAvatar
              v-else
              :name="primaryLabel"
              :src="avatarSrc"
              size="sm"
              class="-ml-1 rounded-md group-data-[collapsible=icon]:ml-0!"
            />
            <div
              class="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden"
            >
              <template v-if="noAccount">
                <span
                  class="truncate text-sm font-medium text-sidebar-foreground"
                  >{{ t("userMenu.localAccount") }}</span
                >
                <span class="truncate text-xs text-sidebar-foreground/60">{{
                  t("userMenu.localAccountHint")
                }}</span>
              </template>
              <template v-else>
                <span
                  class="truncate text-sm font-medium text-sidebar-foreground"
                  >{{ primaryLabel }}</span
                >
                <span
                  v-if="secondaryLabel"
                  class="truncate text-xs text-sidebar-foreground/60"
                  >{{ secondaryLabel }}</span
                >
              </template>
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
          <template v-if="!noAccount">
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
          </template>
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
            <DropdownMenuItem v-if="noAccount" as-child>
              <NuxtLink
                to="/auth/login"
                class="cursor-pointer flex items-center"
              >
                <Plug />
                {{ t("userMenu.connectServer") }}
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuItem
              v-else
              class="cursor-pointer"
              @click="handleLogout"
            >
              <LogOut />
              {{ t("commandMenu.account.logout") }}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
