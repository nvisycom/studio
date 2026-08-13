import type { ActivityPayload } from "@nvisy/sdk/datatypes";

/**
 * An activity's human-readable content, expressed as i18n descriptors so the
 * caller renders it: `t(titleKey)` and `t(messageKey, params)`.
 *
 * The API no longer ships a pre-rendered `description` — each activity carries
 * an optional, typed {@link ActivityPayload} discriminated by `activityType`,
 * and the client turns it into copy. Keeping that mapping here (rather than in
 * the pages) keeps the components declarative and the strings in one place.
 *
 * `category` is the segment before the first dot of `activityType` (e.g.
 * `workspace`, `member`, `file`), which the UI uses to group, filter and pick
 * an icon.
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
 * `payload` can be `undefined` on an {@link Activity} (stored params didn't
 * decode); callers guard that and only pass a defined payload here.
 */
export function activityContent(payload: ActivityPayload): ActivityContent {
	switch (payload.activityType) {
		case "workspace.created":
			return content("workspaceCreated", "workspace", {
				workspaceSlug: payload.workspaceSlug,
			});
		case "workspace.updated":
			return content("workspaceUpdated", "workspace", {
				workspaceSlug: payload.workspaceSlug,
			});
		case "workspace.deleted":
			return content("workspaceDeleted", "workspace", {
				workspaceSlug: payload.workspaceSlug,
			});
		case "member.added":
			return content("memberAdded", "member", {
				memberUsername: payload.memberUsername,
			});
		case "member.updated":
			return content("memberUpdated", "member", {
				memberUsername: payload.memberUsername,
			});
		case "member.deleted":
			return content("memberDeleted", "member", {
				memberUsername: payload.memberUsername,
			});
		case "invite.created":
			return content("inviteCreated", "invite", {
				email: payload.email,
				inviteId: payload.inviteId,
			});
		case "invite.accepted":
			return content("inviteAccepted", "invite", {
				email: payload.email,
				inviteId: payload.inviteId,
			});
		case "invite.declined":
			return content("inviteDeclined", "invite", {
				email: payload.email,
				inviteId: payload.inviteId,
			});
		case "invite.canceled":
			return content("inviteCanceled", "invite", {
				email: payload.email,
				inviteId: payload.inviteId,
			});
		case "connection.created":
			return content("connectionCreated", "connection", {
				connectionId: payload.connectionId,
			});
		case "connection.updated":
			return content("connectionUpdated", "connection", {
				connectionId: payload.connectionId,
			});
		case "connection.deleted":
			return content("connectionDeleted", "connection", {
				connectionId: payload.connectionId,
			});
		case "connection.sync.completed":
			return content("connectionSyncCompleted", "connection", {
				connectionId: payload.connectionId,
			});
		case "connection.sync.failed":
			return content("connectionSyncFailed", "connection", {
				connectionId: payload.connectionId,
			});
		case "webhook.created":
			return content("webhookCreated", "webhook", {
				webhookId: payload.webhookId,
			});
		case "webhook.updated":
			return content("webhookUpdated", "webhook", {
				webhookId: payload.webhookId,
			});
		case "webhook.deleted":
			return content("webhookDeleted", "webhook", {
				webhookId: payload.webhookId,
			});
		case "webhook.triggered":
			return content("webhookTriggered", "webhook", {
				webhookId: payload.webhookId,
			});
		case "file.created":
			return content("fileCreated", "file", {
				fileId: payload.fileId,
				fileName: payload.fileName,
			});
		case "file.updated":
			return content("fileUpdated", "file", {
				fileId: payload.fileId,
				fileName: payload.fileName,
			});
		case "file.deleted":
			return content("fileDeleted", "file", {
				fileId: payload.fileId,
				fileName: payload.fileName,
			});
		case "file.verified":
			return content("fileVerified", "file", {
				fileId: payload.fileId,
				fileName: payload.fileName,
			});
		case "pipeline.created":
			return content("pipelineCreated", "pipeline", {
				pipelineSlug: payload.pipelineSlug,
			});
		case "pipeline.updated":
			return content("pipelineUpdated", "pipeline", {
				pipelineSlug: payload.pipelineSlug,
			});
		case "pipeline.deleted":
			return content("pipelineDeleted", "pipeline", {
				pipelineSlug: payload.pipelineSlug,
			});
		case "pipeline.run.started":
			return content("pipelineRunStarted", "pipeline", {
				pipelineSlug: payload.pipelineSlug,
				runId: payload.runId,
			});
		case "pipeline.run.analyzed":
			return content("pipelineRunAnalyzed", "pipeline", {
				pipelineSlug: payload.pipelineSlug,
				runId: payload.runId,
			});
		case "pipeline.run.completed":
			return content("pipelineRunCompleted", "pipeline", {
				pipelineSlug: payload.pipelineSlug,
				runId: payload.runId,
			});
		case "pipeline.run.failed":
			return content("pipelineRunFailed", "pipeline", {
				pipelineSlug: payload.pipelineSlug,
				runId: payload.runId,
			});
		case "policy.created":
			return content("policyCreated", "policy", {
				policyId: payload.policyId,
			});
		case "policy.updated":
			return content("policyUpdated", "policy", {
				policyId: payload.policyId,
			});
		case "policy.deleted":
			return content("policyDeleted", "policy", {
				policyId: payload.policyId,
			});
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
