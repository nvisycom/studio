import type { ActivityPayload } from "@nvisy/sdk/datatypes";

/**
 * An activity's human-readable content, expressed as i18n descriptors so the
 * caller renders it: `t(titleKey)` and `t(messageKey, params)`.
 *
 * The API no longer ships a pre-rendered `description` — each activity carries
 * an optional, typed {@link ActivityPayload} discriminated by `type`, with the
 * event data under a nested `data` object. The client turns it into copy;
 * keeping that mapping here (rather than in the pages) keeps the components
 * declarative and the strings in one place.
 *
 * `category` is the segment before the first dot of `type` (e.g. `workspace`,
 * `member`, `file`), which the UI uses to group, filter and pick an icon.
 */
export interface ActivityContent {
	titleKey: string;
	messageKey: string;
	params: Record<string, unknown>;
	category: string;
	/** The verb — the last segment of the event `type` (created/updated/…). */
	action: string;
}

// Categories the UI has icons and `activities.category.*` labels for. An event
// whose prefix isn't one of these (a newer API) falls back to "unknown" so the
// row doesn't render an unresolved i18n key.
const KNOWN_CATEGORIES = new Set([
	"workspace",
	"member",
	"invite",
	"connection",
	"webhook",
	"file",
	"pipeline",
	"policy",
]);

/**
 * Map an activity payload to its i18n title/message descriptors plus category.
 *
 * Keys live under `activities.events.<camelKey>` in the locale files, with the
 * dots in the event name flattened to a dot-free segment (e.g.
 * `connection.sync.completed` → `connectionSyncCompleted`) so vue-i18n doesn't
 * treat them as path separators. This mirrors the notifications convention.
 *
 * `payload` can be `undefined` on an Activity (stored params didn't decode);
 * callers guard that and only pass a defined payload here.
 */
export function activityContent(payload: ActivityPayload): ActivityContent {
	const type = payload.type as string;
	// The verb is the segment after the last dot (e.g. `pipeline.run.completed`
	// → "completed"). Drives the action badge on the activity icon.
	const action = type.slice(type.lastIndexOf(".") + 1);
	return { ...resolveContent(payload), action };
}

function resolveContent(
	payload: ActivityPayload,
): Omit<ActivityContent, "action"> {
	const { type } = payload;
	switch (type) {
		case "workspace.created":
			return content("workspaceCreated", "workspace", payload.data);
		case "workspace.updated":
			return content("workspaceUpdated", "workspace", payload.data);
		case "workspace.deleted":
			return content("workspaceDeleted", "workspace", payload.data);
		case "member.added":
			return content("memberAdded", "member", payload.data);
		case "member.updated":
			return content("memberUpdated", "member", payload.data);
		case "member.deleted":
			return content("memberDeleted", "member", payload.data);
		case "invite.created":
			return content("inviteCreated", "invite", payload.data);
		case "invite.accepted":
			return content("inviteAccepted", "invite", payload.data);
		case "invite.declined":
			return content("inviteDeclined", "invite", payload.data);
		case "invite.canceled":
			return content("inviteCanceled", "invite", payload.data);
		case "connection.created":
			return content("connectionCreated", "connection", payload.data);
		case "connection.updated":
			return content("connectionUpdated", "connection", payload.data);
		case "connection.deleted":
			return content("connectionDeleted", "connection", payload.data);
		case "connection.sync.started":
			return content("connectionSyncStarted", "connection", payload.data);
		case "connection.sync.completed":
			return content("connectionSyncCompleted", "connection", payload.data);
		case "connection.sync.failed":
			return content("connectionSyncFailed", "connection", payload.data);
		case "webhook.created":
			return content("webhookCreated", "webhook", payload.data);
		case "webhook.updated":
			return content("webhookUpdated", "webhook", payload.data);
		case "webhook.deleted":
			return content("webhookDeleted", "webhook", payload.data);
		case "file.created":
			return content("fileCreated", "file", payload.data);
		case "file.updated":
			return content("fileUpdated", "file", payload.data);
		case "file.deleted":
			return content("fileDeleted", "file", payload.data);
		case "pipeline.created":
			return content("pipelineCreated", "pipeline", payload.data);
		case "pipeline.updated":
			return content("pipelineUpdated", "pipeline", payload.data);
		case "pipeline.deleted":
			return content("pipelineDeleted", "pipeline", payload.data);
		case "pipeline.run.started":
			return content("pipelineRunStarted", "pipeline", payload.data);
		case "pipeline.run.analyzed":
			return content("pipelineRunAnalyzed", "pipeline", payload.data);
		case "pipeline.run.completed":
			return content("pipelineRunCompleted", "pipeline", payload.data);
		case "pipeline.run.failed":
			return content("pipelineRunFailed", "pipeline", payload.data);
		case "policy.created":
			return content("policyCreated", "policy", payload.data);
		case "policy.updated":
			return content("policyUpdated", "policy", payload.data);
		case "policy.deleted":
			return content("policyDeleted", "policy", payload.data);
		// Version skew: a deployed API newer than this bundle can emit a `type`
		// the pinned SDK union doesn't cover. Fall back to a generic entry so the
		// row still renders. `type` is narrowed to `never` here (all known cases
		// handled), so widen it back to string to read the runtime value. Only
		// keep the prefix as the category when it's one we have a label for;
		// otherwise use "unknown" so the UI never shows an unresolved key.
		default: {
			const unknownType = type as string;
			const prefix = unknownType.split(".")[0] ?? "";
			const category = KNOWN_CATEGORIES.has(prefix) ? prefix : "unknown";
			return content("unknown", category, { type: unknownType });
		}
	}
}

function content(
	key: string,
	category: string,
	params: Record<string, unknown>,
): Omit<ActivityContent, "action"> {
	return {
		titleKey: `activities.events.${key}.title`,
		messageKey: `activities.events.${key}.message`,
		params,
		category,
	};
}

// The action badge is a single colored dot — one shape, the color carries the
// meaning (the row's message spells out the verb). Green = additive/success,
// red = removal/failure, amber = change, blue = a run in motion, muted = neutral
// or unknown. Tints match those used elsewhere in the app.
// A quiet accent dot, not an alert: desaturated and low-opacity in light mode so
// it sits behind the icon, a touch brighter (but still restrained) in dark mode
// where it needs to read against the dark surface. Color carries the meaning —
// green = additive/success, red = removal/failure, amber = change, blue = a run
// in motion, muted = neutral/unknown; the row's message spells out the verb.
const ACTION_COLOR: Record<string, string> = {
	created: "bg-emerald-600/50 dark:bg-emerald-500/60",
	added: "bg-emerald-600/50 dark:bg-emerald-500/60",
	accepted: "bg-emerald-600/50 dark:bg-emerald-500/60",
	completed: "bg-emerald-600/50 dark:bg-emerald-500/60",
	updated: "bg-amber-600/50 dark:bg-amber-500/60",
	deleted: "bg-red-700/50 dark:bg-red-500/60",
	failed: "bg-red-700/50 dark:bg-red-500/60",
	declined: "bg-red-700/50 dark:bg-red-500/60",
	canceled: "bg-muted-foreground/40 dark:bg-muted-foreground/60",
	started: "bg-blue-600/50 dark:bg-blue-500/60",
	analyzed: "bg-blue-600/50 dark:bg-blue-500/60",
	triggered: "bg-blue-600/50 dark:bg-blue-500/60",
};

/** Background color class for an activity action's badge dot (muted if unknown). */
export function activityActionColor(action: string): string {
	return ACTION_COLOR[action] ?? "bg-muted-foreground";
}
