import type { LucideIcon } from "@lucide/vue";
import {
	BarChart3,
	ClipboardCheck,
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
/**
 * Items whose data lives only on the server — no local backend. For a local
 * workspace they have nothing to show, so they're dropped from the nav entirely
 * rather than rendered disabled. Everything else (overview, documents, studio,
 * workflows, policies, settings) runs through a local seam and stays.
 *
 * `reviews` is server-only: the reviewer queue is about assigning reviews to
 * workspace accounts/members, which a local folder-workspace has none of (the
 * studio's own review-an-audit flow is separate and stays). It was mis-kept as
 * local before, which hung the page on a never-arriving account id offline.
 */
const SERVER_ONLY_ITEMS = new Set([
	"team",
	"reviews",
	"integrations",
	"webhooks",
	"analytics",
	"logs",
	"billing",
]);

export function useNavigation() {
	const { t } = useI18n();
	const { wLink } = useWorkspaceLink();
	const { currentWorkspaceSlug, currentWorkspace, currentWorkspaceIsLocal } =
		useWorkspaces();

	// The nav gates on the ACTIVE WORKSPACE'S origin, not the session: a local
	// folder-workspace hides the server-only items (team, integrations, …) and
	// drops the account-role gate ("no account" means no role locally); a server
	// workspace shows them even on desktop. Reactive, so switching workspaces
	// re-filters the nav with no reload.
	const localWorkspace = currentWorkspaceIsLocal;

	const hasWorkspace = computed(() => !!currentWorkspaceSlug.value);
	const isAdminOrOwner = computed(() => {
		// A local workspace has no membership/role; treat automation as ungated.
		if (localWorkspace.value) return true;
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
						id: "documents",
						title: t("sidebar.documents"),
						url: wLink("/documents"),
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
						id: "reviews",
						title: t("sidebar.reviews"),
						url: wLink("/reviews"),
						icon: ClipboardCheck,
						shortcut: "R",
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

		// A local workspace drops the server-only items (they have no local data).
		const filtered = localWorkspace.value
			? raw.map((group) => ({
					...group,
					items: group.items.filter((item) => !SERVER_ONLY_ITEMS.has(item.id)),
				}))
			: raw;

		// Keep only non-empty groups (role/workspace gating, or the local-workspace
		// filter above, can empty one out).
		return filtered.filter((group) => group.items.length > 0);
	});

	return { overview, groups, hasWorkspace, isAdminOrOwner };
}
