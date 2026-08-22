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
}

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
		// the pinned SDK union doesn't cover. Fall back to a generic entry
		// (category = the segment before the first dot) so the row still renders.
		// `type` is narrowed to `never` here (all known cases handled), so widen
		// it back to string to read the runtime value.
		default: {
			const unknownType = type as string;
			return content("unknown", unknownType.split(".")[0] ?? "workspace", {
				type: unknownType,
			});
		}
	}
}

function content(
	key: string,
	category: string,
	params: Record<string, unknown>,
): ActivityContent {
	return {
		titleKey: `activities.events.${key}.title`,
		messageKey: `activities.events.${key}.message`,
		params,
		category,
	};
}
