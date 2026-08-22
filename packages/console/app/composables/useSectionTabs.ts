import {
	Plug,
	Webhook as WebhookIcon,
	Compass,
	History,
	Workflow,
	ShieldCheck,
	LayoutTemplate,
	Settings,
	Database,
	Bell,
	BarChart3,
	FileSearch,
	User,
	Key,
} from "@lucide/vue";
import type { SectionTab } from "#console/components/layout/header";

/**
 * The navigation tabs for each header section, translated. A page renders its
 * section's tabs into the app-header socket via
 * `<HeaderSocket><SectionTabs :tabs="tabs.policies" /></HeaderSocket>`. This is
 * the single source of truth for section tabs (it replaced the per-route
 * branches that lived in HeaderTabs).
 */
export function useSectionTabs() {
	const { t } = useI18n();

	const policies = computed<SectionTab[]>(() => [
		{
			value: "policies",
			label: t("header.tabs.policies.index"),
			icon: ShieldCheck,
			to: "/policies",
		},
		{
			value: "templates",
			label: t("header.tabs.policies.templates"),
			icon: LayoutTemplate,
			to: "/policies/templates",
		},
	]);

	const workflows = computed<SectionTab[]>(() => [
		{
			value: "workflows",
			label: t("header.tabs.workflows.index"),
			icon: Workflow,
			to: "/workflows",
		},
		{
			value: "runs",
			label: t("header.tabs.workflows.runs"),
			icon: History,
			to: "/workflows/runs",
		},
	]);

	const integrations = computed<SectionTab[]>(() => [
		{
			value: "connections",
			label: t("header.tabs.connections.connections"),
			icon: Plug,
			to: "/integrations",
		},
		{
			value: "webhooks",
			label: t("header.tabs.connections.webhooks"),
			icon: WebhookIcon,
			to: "/integrations/webhooks",
		},
		{
			value: "explore",
			label: t("header.tabs.connections.explore"),
			icon: Compass,
			to: "/integrations/explore",
		},
		{
			value: "runs",
			label: t("header.tabs.connections.runs"),
			icon: History,
			to: "/integrations/runs",
		},
	]);

	const settings = computed<SectionTab[]>(() => [
		{
			value: "general",
			label: t("header.tabs.settings.general"),
			icon: Settings,
			to: "/settings/general",
		},
		{
			value: "data",
			label: t("header.tabs.settings.data"),
			icon: Database,
			to: "/settings/data",
		},
		{
			value: "notifications",
			label: t("header.tabs.settings.notifications"),
			icon: Bell,
			to: "/settings/notifications",
		},
	]);

	const analytics = computed<SectionTab[]>(() => [
		{
			value: "overview",
			label: t("header.tabs.analytics.overview"),
			icon: BarChart3,
			to: "/analytics",
		},
		{
			value: "logs",
			label: t("header.tabs.analytics.logs"),
			icon: FileSearch,
			to: "/analytics/logs",
		},
	]);

	// Account tabs live outside a workspace (paths are absolute).
	const account = computed<SectionTab[]>(() => [
		{
			value: "general",
			label: t("header.tabs.account.general"),
			icon: User,
			to: "/account/general",
		},
		{
			value: "tokens",
			label: t("header.tabs.account.tokens"),
			icon: Key,
			to: "/account/tokens",
		},
	]);

	return { policies, workflows, integrations, settings, analytics, account };
}
