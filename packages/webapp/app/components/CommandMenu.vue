<script setup lang="ts">
import { ref, computed } from "vue";
import {
	Calculator,
	Calendar,
	CreditCard,
	Settings,
	FileText,
	Users,
	Bell,
	Lock,
	Home,
	LayoutGrid,
	Search,
	User,
	LogOut,
	Command as CommandIcon,
} from "lucide-vue-next";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const router = useRouter();

const isOpen = defineModel<boolean>("open", { required: true });

// Navigation items
const navigationItems = [
	{ label: "Dashboard", icon: Home, href: "/", shortcut: "⌘H" },
	{ label: "Documents", icon: FileText, href: "/documents", shortcut: "⌘D" },
	{
		label: "Integrations",
		icon: LayoutGrid,
		href: "/integrations",
		shortcut: "⌘I",
	},
	{ label: "Members", icon: Users, href: "/members", shortcut: "⌘M" },
];

// Settings items
const settingsItems = [
	{
		label: "General",
		icon: Settings,
		href: "/settings?section=general",
		shortcut: "⌘G",
	},
	{
		label: "Billing",
		icon: CreditCard,
		href: "/settings?section=billing",
		shortcut: "⌘B",
	},
	{
		label: "Notifications",
		icon: Bell,
		href: "/settings?section=notifications",
		shortcut: "⌘N",
	},
	{
		label: "Security",
		icon: Lock,
		href: "/settings?section=security",
		shortcut: "⌘S",
	},
];

// Account items
const accountItems = [
	{ label: "Profile", icon: User, href: "/account", shortcut: "⌘P" },
	{
		label: "Activity",
		icon: Calendar,
		href: "/account/activity",
		shortcut: "⌘A",
	},
];

function navigateTo(href: string) {
	router.push(href);
	isOpen.value = false;
}

function logout() {
	// TODO: Implement logout logic
	isOpen.value = false;
}

// Keyboard shortcut handling
function handleKeydown(event: KeyboardEvent) {
	if (!isOpen.value) return;

	// Close on escape
	if (event.key === "Escape") {
		isOpen.value = false;
		return;
	}
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="p-0 gap-0 max-w-[600px]" @keydown="handleKeydown">
      <Command class="rounded-lg border-0 shadow-none">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            <CommandItem
              v-for="item in navigationItems"
              :key="item.href"
              :value="item.label.toLowerCase()"
              @select="navigateTo(item.href)"
              class="cursor-pointer"
            >
              <component :is="item.icon" class="mr-2 h-4 w-4" />
              <span>{{ item.label }}</span>
              <CommandShortcut v-if="item.shortcut">{{ item.shortcut }}</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Settings">
            <CommandItem
              v-for="item in settingsItems"
              :key="item.href"
              :value="item.label.toLowerCase()"
              @select="navigateTo(item.href)"
              class="cursor-pointer"
            >
              <component :is="item.icon" class="mr-2 h-4 w-4" />
              <span>{{ item.label }}</span>
              <CommandShortcut v-if="item.shortcut">{{ item.shortcut }}</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Account">
            <CommandItem
              v-for="item in accountItems"
              :key="item.href"
              :value="item.label.toLowerCase()"
              @select="navigateTo(item.href)"
              class="cursor-pointer"
            >
              <component :is="item.icon" class="mr-2 h-4 w-4" />
              <span>{{ item.label }}</span>
              <CommandShortcut v-if="item.shortcut">{{ item.shortcut }}</CommandShortcut>
            </CommandItem>

            <CommandItem
              value="logout"
              @select="logout"
              class="cursor-pointer text-red-600 dark:text-red-400"
            >
              <LogOut class="mr-2 h-4 w-4" />
              <span>Log out</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </DialogContent>
  </Dialog>
</template>
