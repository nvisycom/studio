import type { Component } from "vue";
import {
	Compass,
	Copy,
	Key,
	LogOut,
	MessageSquare,
	Moon,
	Plus,
	ShieldCheck,
	Sun,
	Upload,
	User,
	UserPlus,
	Workflow,
} from "@lucide/vue";
import { toast } from "vue-sonner";
import type { Feature } from "#console/composables/useFeatures";
import type { NavigationItem } from "#console/composables/useNavigation";

/**
 * A runnable command in the palette: either a navigation link (from
 * `useNavigation`) or an action. Both carry enough to render one row and, when
 * they have a `shortcut`, to bind the matching global keyboard shortcut — from
 * this single definition, so the hint shown and the key bound never drift.
 */
export interface CommandEntry {
	id: string;
	label: string;
	icon: Component;
	shortcut?: string;
	feature?: Feature;
	danger?: boolean;
	run: () => void;
}

export interface CommandSection {
	id: string;
	label: string;
	entries: CommandEntry[];
}

// Shared singleton open state — any trigger (the account menu, the ⌘K shortcut)
// drives the one palette mounted in the shell.
const isOpen = ref(false);

export function useCommandMenu() {
	const { t } = useI18n();
	const { overview, groups } = useNavigation();
	const { wLink } = useWorkspaceLink();
	const colorMode = useColorMode();
	const { logout } = useAuth();
	const { openUpload } = useFilesView();
	const { open: openHelpChat } = useHelpChat();
	const { open: openCreateWorkspace } = useCreateWorkspace();
	const { open: openCreatePolicy } = useCreatePolicy();
	const { open: openCreatePipeline } = useCreatePipeline();
	const { generateCodeAsync } = useInvites();

	function open() {
		isOpen.value = true;
	}
	function close() {
		isOpen.value = false;
	}
	function toggle() {
		isOpen.value = !isOpen.value;
	}

	// Run a command and dismiss the palette. Navigations and actions both go
	// through here so closing is uniform.
	function run(fn: () => void) {
		fn();
		close();
	}

	function navTo(url: string) {
		run(() => navigateTo(url));
	}

	// ── Actions ────────────────────────────────────────────────────────────────
	// Each action's `run` calls the composable that OWNS the capability directly
	// (upload → useFilesView, support → useHelpChat, create workspace →
	// useCreateWorkspace), so the palette doesn't emit up to a parent that routes
	// the request back down.

	async function createInviteCode() {
		try {
			const result = await generateCodeAsync({
				invitedRole: "editor",
				expiresIn: "in7Days",
			});
			// Invite links must point at the web app, not the current origin — on
			// desktop that origin is `tauri://`, which no one can open. Fall back to
			// the current origin when no web-app URL is configured (web). Strip any
			// trailing slash so the join path doesn't double up.
			const baseUrl = (
				useRuntimeConfig().public.webAppUrl || window.location.origin
			).replace(/\/+$/, "");
			await navigator.clipboard.writeText(
				`${baseUrl}/join/${result.inviteCode}`,
			);
			toast.success(t("commandMenu.actions.inviteCodeCreated"));
		} catch {
			toast.error(t("commandMenu.actions.inviteCodeFailed"));
		}
	}

	const actions = computed<CommandEntry[]>(() => [
		{
			id: "create-workspace",
			label: t("commandMenu.actions.createWorkspace"),
			icon: Plus,
			shortcut: "N",
			run: () => run(openCreateWorkspace),
		},
		{
			id: "create-policy",
			label: t("commandMenu.actions.createPolicy"),
			icon: ShieldCheck,
			run: () => run(openCreatePolicy),
		},
		{
			id: "create-pipeline",
			label: t("commandMenu.actions.createPipeline"),
			icon: Workflow,
			run: () => run(openCreatePipeline),
		},
		{
			id: "create-api-token",
			label: t("commandMenu.actions.createApiToken"),
			icon: Key,
			run: () => navTo("/account/tokens"),
		},
		{
			id: "explore-integrations",
			label: t("commandMenu.actions.exploreIntegrations"),
			icon: Compass,
			run: () => navTo(wLink("/integrations/explore")),
		},
		{
			id: "upload-file",
			label: t("commandMenu.actions.uploadFile"),
			icon: Upload,
			shortcut: "U",
			run: () => run(openUpload),
		},
		{
			id: "invite-member",
			label: t("commandMenu.actions.inviteMember"),
			icon: UserPlus,
			shortcut: "M",
			run: () => navTo(wLink("/team")),
		},
		{
			id: "create-invite-code",
			label: t("commandMenu.actions.createInviteCode"),
			icon: Copy,
			run: () => run(createInviteCode),
		},
		{
			id: "toggle-theme",
			label: t("commandMenu.actions.toggleTheme"),
			icon: colorMode.value === "dark" ? Sun : Moon,
			run: () =>
				run(() => {
					colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
				}),
		},
		{
			id: "open-support",
			label: t("commandMenu.actions.openSupport"),
			icon: MessageSquare,
			feature: "support",
			run: () => run(openHelpChat),
		},
	]);

	// ── Sections: actions, then each nav group, then account ────────────────────
	function navEntry(item: NavigationItem): CommandEntry {
		return {
			id: item.id,
			label: item.title,
			icon: item.icon,
			shortcut: item.shortcut,
			run: () => navTo(item.url),
		};
	}

	// Command entries for a group's ENABLED items only. A disabled destination
	// (no workspace, insufficient role) would otherwise both list in the palette
	// and bind its global shortcut — and `wLink` returns "/" with no workspace, so
	// the shortcut would navigate somewhere wrong.
	function navEntries(items: NavigationItem[]): CommandEntry[] {
		return items.filter((item) => !item.disabled).map(navEntry);
	}

	const { has } = useFeatures();

	const sections = computed<CommandSection[]>(() => {
		const out: CommandSection[] = [];

		out.push({
			id: "actions",
			label: t("commandMenu.actions.title"),
			entries: actions.value.filter((a) => !a.feature || has(a.feature)),
		});

		// Overview leads its own single-item group so it isn't buried.
		out.push({
			id: "overview",
			label: t("sidebar.workspace"),
			entries: navEntries([
				overview.value,
				...(groups.value.find((g) => g.id === "workspace")?.items ?? []),
			]),
		});

		for (const group of groups.value) {
			if (group.id === "workspace") continue; // folded into overview above
			out.push({
				id: group.id,
				label: group.label,
				entries: navEntries(group.items),
			});
		}

		out.push({
			id: "account",
			label: t("commandMenu.account.title"),
			entries: [
				{
					id: "profile",
					label: t("commandMenu.account.profile"),
					icon: User,
					shortcut: "P",
					run: () => navTo("/account/general"),
				},
				{
					id: "tokens",
					label: t("commandMenu.account.tokens"),
					icon: Key,
					run: () => navTo("/account/tokens"),
				},
				{
					id: "logout",
					label: t("commandMenu.account.logout"),
					icon: LogOut,
					danger: true,
					run: () => run(logout),
				},
			],
		});

		// Drop any group left empty once disabled items are filtered out.
		return out.filter((section) => section.entries.length > 0);
	});

	// Global ⌘/Ctrl + <key> shortcuts, derived from the entries that carry one, so
	// the binding and the hint come from a single definition. Only active while
	// the palette is closed (an open palette handles its own key input).
	const shortcutConfig = computed<Record<string, () => void>>(() => {
		if (isOpen.value) return {};
		const config: Record<string, () => void> = {};
		for (const section of sections.value) {
			for (const entry of section.entries) {
				if (entry.shortcut) {
					config[`meta_${entry.shortcut.toLowerCase()}`] = entry.run;
				}
			}
		}
		return config;
	});

	return { isOpen, open, close, toggle, sections, shortcutConfig };
}
