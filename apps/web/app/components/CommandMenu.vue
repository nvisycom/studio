<script setup lang="ts">
import {
	LayoutDashboard,
	FolderOpen,
	PenTool,
	Users,
	Puzzle,
	Compass,
	BarChart3,
	FileSearch,
	CreditCard,
	Settings,
	User,
	Key,
	LogOut,
	Plus,
	Upload,
	UserPlus,
	Moon,
	Sun,
	MessageSquare,
	Copy,
} from "@lucide/vue";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "#console/components/ui/command";
import { Dialog, DialogContent } from "#console/components/ui/dialog";
import { Kbd } from "#console/components/ui/kbd";
import { toast } from "vue-sonner";

const router = useRouter();
const { t } = useI18n();
const colorMode = useColorMode();
const { getKbdKey } = useKbd();
const { logout: performLogout } = useAuth();

const isOpen = defineModel<boolean>("open", { required: true });

// Emit for actions that need parent handling
const emit = defineEmits<{
	createWorkspace: [];
	uploadFile: [];
	openSupport: [];
}>();

// Get current workspace and invite functionality
const { currentWorkspace } = useWorkspaces();
const { generateCodeAsync, isGenerating } = useInvites();

// Navigation items - matching sidebar structure
const navigationItems = computed(() => [
	{
		label: t("sidebar.overview"),
		icon: LayoutDashboard,
		href: "/",
		shortcut: "O",
	},
	{
		label: t("sidebar.files"),
		icon: FolderOpen,
		href: "/files",
		shortcut: "F",
	},
	{ label: t("sidebar.studio"), icon: PenTool, href: "/studio", shortcut: "S" },
	{ label: t("sidebar.team"), icon: Users, href: "/team", shortcut: "T" },
]);

// Automation items
const automationItems = computed(() => [
	{
		label: t("sidebar.integrations"),
		icon: Puzzle,
		href: "/integrations",
		shortcut: "I",
	},
	{ label: t("sidebar.explore"), icon: Compass, href: "/integrations/explore" },
]);

// Observability items
const observabilityItems = computed(() => [
	{
		label: t("sidebar.analytics"),
		icon: BarChart3,
		href: "/analytics",
		shortcut: "A",
	},
	{
		label: t("sidebar.logs"),
		icon: FileSearch,
		href: "/analytics/logs",
		shortcut: "L",
	},
]);

// Settings items
const settingsItems = computed(() => [
	{
		label: t("sidebar.billing"),
		icon: CreditCard,
		href: "/billing",
		shortcut: "B",
	},
	{ label: t("sidebar.settings"), icon: Settings, href: "/settings/general" },
]);

// Account items
const accountItems = computed(() => [
	{
		label: t("commandMenu.account.profile"),
		icon: User,
		href: "/account",
		shortcut: "P",
	},
	{
		label: t("commandMenu.account.tokens"),
		icon: Key,
		href: "/account/tokens",
	},
]);

// Quick actions
const quickActions = computed(() => [
	{
		id: "create-workspace",
		label: t("commandMenu.actions.createWorkspace"),
		icon: Plus,
		shortcut: "N",
	},
	{
		id: "upload-file",
		label: t("commandMenu.actions.uploadFile"),
		icon: Upload,
		shortcut: "U",
	},
	{
		id: "invite-member",
		label: t("commandMenu.actions.inviteMember"),
		icon: UserPlus,
		shortcut: "M",
	},
	{
		id: "create-invite-code",
		label: t("commandMenu.actions.createInviteCode"),
		icon: Copy,
	},
	{
		id: "toggle-theme",
		label: t("commandMenu.actions.toggleTheme"),
		icon: colorMode.value === "dark" ? Sun : Moon,
	},
	{
		id: "open-support",
		label: t("commandMenu.actions.openSupport"),
		icon: MessageSquare,
	},
]);

function navigateTo(href: string) {
	router.push(href);
	isOpen.value = false;
}

async function executeAction(actionId: string) {
	switch (actionId) {
		case "create-workspace":
			emit("createWorkspace");
			break;
		case "upload-file":
			emit("uploadFile");
			break;
		case "invite-member":
			navigateTo("/team");
			return;
		case "create-invite-code":
			try {
				const result = await generateCodeAsync({
					invitedRole: "member",
					expiresIn: "in7Days",
				});
				const baseUrl = window.location.origin;
				const inviteUrl = `${baseUrl}/join/${result.inviteCode}`;
				await navigator.clipboard.writeText(inviteUrl);
				toast.success(t("commandMenu.actions.inviteCodeCreated"));
			} catch (err) {
				toast.error(t("commandMenu.actions.inviteCodeFailed"));
			}
			break;
		case "toggle-theme":
			colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
			break;
		case "open-support":
			emit("openSupport");
			break;
	}
	isOpen.value = false;
}

function logout() {
	isOpen.value = false;
	performLogout();
}

// Global keyboard shortcuts (only when command menu is closed)
defineShortcuts(
	computed(() =>
		isOpen.value
			? {}
			: {
					meta_o: () => navigateTo("/"),
					meta_f: () => navigateTo("/files"),
					meta_s: () => navigateTo("/studio"),
					meta_t: () => navigateTo("/team"),
					meta_i: () => navigateTo("/integrations"),
					meta_a: () => navigateTo("/analytics"),
					meta_l: () => navigateTo("/analytics/logs"),
					meta_b: () => navigateTo("/billing"),
					meta_p: () => navigateTo("/account"),
					meta_n: () => executeAction("create-workspace"),
					meta_u: () => executeAction("upload-file"),
					meta_m: () => executeAction("invite-member"),
				},
	),
);
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="p-0 gap-0 max-w-[600px]">
      <Command class="rounded-lg border-0 shadow-none">
        <CommandInput :placeholder="t('commandMenu.placeholder')" />
        <CommandList>
          <CommandEmpty>{{ t("commandMenu.noResults") }}</CommandEmpty>

          <CommandGroup :heading="t('commandMenu.actions.title')">
            <CommandItem
              v-for="action in quickActions"
              :key="action.id"
              :value="action.label.toLowerCase()"
              class="cursor-pointer"
              @select="executeAction(action.id)"
            >
              <component :is="action.icon" class="mr-2 h-4 w-4" />
              <span>{{ action.label }}</span>
              <div
                v-if="action.shortcut"
                class="ml-auto flex items-center gap-1"
              >
                <Kbd>{{ getKbdKey("meta") }}</Kbd>
                <Kbd>{{ action.shortcut }}</Kbd>
              </div>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup :heading="t('sidebar.workspace')">
            <CommandItem
              v-for="item in navigationItems"
              :key="item.href"
              :value="item.label.toLowerCase()"
              class="cursor-pointer"
              @select="navigateTo(item.href)"
            >
              <component :is="item.icon" class="mr-2 h-4 w-4" />
              <span>{{ item.label }}</span>
              <div v-if="item.shortcut" class="ml-auto flex items-center gap-1">
                <Kbd>{{ getKbdKey("meta") }}</Kbd>
                <Kbd>{{ item.shortcut }}</Kbd>
              </div>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup :heading="t('sidebar.automation')">
            <CommandItem
              v-for="item in automationItems"
              :key="item.href"
              :value="item.label.toLowerCase()"
              class="cursor-pointer"
              @select="navigateTo(item.href)"
            >
              <component :is="item.icon" class="mr-2 h-4 w-4" />
              <span>{{ item.label }}</span>
              <div v-if="item.shortcut" class="ml-auto flex items-center gap-1">
                <Kbd>{{ getKbdKey("meta") }}</Kbd>
                <Kbd>{{ item.shortcut }}</Kbd>
              </div>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup :heading="t('sidebar.observability')">
            <CommandItem
              v-for="item in observabilityItems"
              :key="item.href"
              :value="item.label.toLowerCase()"
              class="cursor-pointer"
              @select="navigateTo(item.href)"
            >
              <component :is="item.icon" class="mr-2 h-4 w-4" />
              <span>{{ item.label }}</span>
              <div v-if="item.shortcut" class="ml-auto flex items-center gap-1">
                <Kbd>{{ getKbdKey("meta") }}</Kbd>
                <Kbd>{{ item.shortcut }}</Kbd>
              </div>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup :heading="t('commandMenu.settings')">
            <CommandItem
              v-for="item in settingsItems"
              :key="item.href"
              :value="item.label.toLowerCase()"
              class="cursor-pointer"
              @select="navigateTo(item.href)"
            >
              <component :is="item.icon" class="mr-2 h-4 w-4" />
              <span>{{ item.label }}</span>
              <div v-if="item.shortcut" class="ml-auto flex items-center gap-1">
                <Kbd>{{ getKbdKey("meta") }}</Kbd>
                <Kbd>{{ item.shortcut }}</Kbd>
              </div>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup :heading="t('commandMenu.account.title')">
            <CommandItem
              v-for="item in accountItems"
              :key="item.href"
              :value="item.label.toLowerCase()"
              class="cursor-pointer"
              @select="navigateTo(item.href)"
            >
              <component :is="item.icon" class="mr-2 h-4 w-4" />
              <span>{{ item.label }}</span>
              <div v-if="item.shortcut" class="ml-auto flex items-center gap-1">
                <Kbd>{{ getKbdKey("meta") }}</Kbd>
                <Kbd>{{ item.shortcut }}</Kbd>
              </div>
            </CommandItem>

            <CommandItem
              value="logout"
              class="cursor-pointer text-red-600 dark:text-red-400"
              @select="logout"
            >
              <LogOut class="mr-2 h-4 w-4" />
              <span>{{ t("commandMenu.account.logout") }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </DialogContent>
  </Dialog>
</template>
