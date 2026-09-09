import type { LucideIcon } from "@lucide/vue";
import {
	BarChart3,
	CreditCard,
	FileSearch,
	FolderOpen,
	LayoutDashboard,
	PenTool,
	Puzzle,
	ShieldCheck,
	Settings,
	Users,
	Webhook as WebhookIcon,
	Workflow,
} from "@lucide/vue";
import type { Feature } from "#console/composables/useFeatures";

/**
 * A single navigable destination in the app shell.
 *
 * `shortcut` is the letter of the `⌘`/`Ctrl` + key global shortcut (rendered in
 * the command menu and bound by it — one source, so the hint and the binding
 * can't drift). `disabled` reflects gating (no workspace, insufficient role);
 * disabled items still render in the sidebar (greyed) but are dropped from the
 * command menu.
 */
export interface NavigationItem {
	/** Stable id, also used as the command-menu entry key. */
	id: string;
	title: string;
	url: string;
	icon: LucideIcon;
	shortcut?: string;
	feature?: Feature;
	disabled?: boolean;
}

export interface NavigationGroup {
	id: string;
	label: string;
	items: NavigationItem[];
}

/**
 * The app's navigation as one source of truth, consumed by both the sidebar and
 * the command menu so a route is declared once and appears in both. Gating
 * (workspace presence, role, feature flags) is applied here, so consumers don't
 * each re-derive it.
 */
export function useNavigation() {
	const { t } = useI18n();
	const { has } = useFeatures();
	const { wLink } = useWorkspaceLink();
	const { currentWorkspaceSlug, currentWorkspace } = useWorkspaces();

	const hasWorkspace = computed(() => !!currentWorkspaceSlug.value);
	const isAdminOrOwner = computed(() => {
		const role = currentWorkspace.value?.memberRole;
		return role === "owner" || role === "admin";
	});

	// Overview stands alone above the labeled groups (it's the workspace home).
	const overview = computed<NavigationItem>(() => ({
		id: "overview",
		title: t("sidebar.overview"),
		url: wLink("/"),
		icon: LayoutDashboard,
		shortcut: "O",
		disabled: !hasWorkspace.value,
	}));

	const groups = computed<NavigationGroup[]>(() => {
		const workspaceDisabled = !hasWorkspace.value;
		// Automation is admin/owner-only, matching the sidebar gating.
		const automationDisabled = !hasWorkspace.value || !isAdminOrOwner.value;

		const raw: NavigationGroup[] = [
			{
				id: "workspace",
				label: t("sidebar.workspace"),
				items: [
					{
						id: "files",
						title: t("sidebar.files"),
						url: wLink("/files"),
						icon: FolderOpen,
						shortcut: "F",
						disabled: workspaceDisabled,
					},
					{
						id: "studio",
						title: t("sidebar.studio"),
						url: wLink("/studio"),
						icon: PenTool,
						shortcut: "S",
						disabled: workspaceDisabled,
					},
					{
						id: "team",
						title: t("sidebar.team"),
						url: wLink("/team"),
						icon: Users,
						shortcut: "T",
						disabled: workspaceDisabled,
					},
				],
			},
			{
				id: "automation",
				label: t("sidebar.automation"),
				items: [
					{
						id: "workflows",
						title: t("sidebar.workflows"),
						url: wLink("/workflows"),
						icon: Workflow,
						disabled: automationDisabled,
					},
					{
						id: "integrations",
						title: t("sidebar.connections"),
						url: wLink("/integrations"),
						icon: Puzzle,
						shortcut: "I",
						disabled: automationDisabled,
					},
					{
						id: "policies",
						title: t("sidebar.policies"),
						url: wLink("/policies"),
						icon: ShieldCheck,
						disabled: automationDisabled,
					},
				],
			},
			{
				id: "observability",
				label: t("sidebar.observability"),
				items: [
					{
						id: "webhooks",
						title: t("sidebar.webhooks"),
						url: wLink("/webhooks"),
						icon: WebhookIcon,
						disabled: workspaceDisabled,
					},
					{
						id: "analytics",
						title: t("sidebar.analytics"),
						url: wLink("/analytics"),
						icon: BarChart3,
						shortcut: "A",
						disabled: workspaceDisabled,
					},
					{
						id: "logs",
						title: t("sidebar.logs"),
						url: wLink("/analytics/logs"),
						icon: FileSearch,
						shortcut: "L",
						disabled: workspaceDisabled,
					},
				],
			},
			{
				id: "settings",
				label: t("commandMenu.settings"),
				items: [
					{
						id: "billing",
						title: t("sidebar.billing"),
						url: wLink("/billing"),
						icon: CreditCard,
						shortcut: "B",
						feature: "billing",
						disabled: workspaceDisabled,
					},
					{
						id: "settings",
						title: t("sidebar.settings"),
						url: wLink("/settings/general"),
						icon: Settings,
						disabled: workspaceDisabled,
					},
				],
			},
		];

		// Drop items whose feature flag is off; keep the group only if non-empty.
		return raw
			.map((group) => ({
				...group,
				items: group.items.filter((item) => !item.feature || has(item.feature)),
			}))
			.filter((group) => group.items.length > 0);
	});

	return { overview, groups, hasWorkspace, isAdminOrOwner };
}
