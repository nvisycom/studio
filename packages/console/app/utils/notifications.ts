import type { NotificationPayload } from "@nvisy/sdk/datatypes";

/**
 * A notification's human-readable content, expressed as i18n descriptors so
 * the caller renders it: `t(titleKey)` and `t(messageKey, params)`.
 *
 * The API no longer ships a pre-rendered title/message — each notification
 * carries a typed {@link NotificationPayload} discriminated by `notifyType`,
 * and the client turns it into copy. Keeping that mapping here (rather than in
 * the dropdown) keeps the component declarative and the strings in one place.
 */
export interface NotificationContent {
	titleKey: string;
	messageKey: string;
	params: Record<string, unknown>;
	/**
	 * Where clicking the notification takes the user, as a workspace-relative
	 * path (the caller prefixes it with the current workspace link). Absent when
	 * there's no meaningful destination (e.g. a system announcement).
	 */
	to?: string;
}

/**
 * Map a notification payload to its i18n title/message descriptors and a target
 * route.
 *
 * Keys live under `notifications.events.<notifyType>` in the locale files,
 * with the colon/dot in the event name flattened to a dot-free segment
 * (e.g. `connection:sync.completed` → `connectionSyncCompleted`).
 */
export function notificationContent(
	payload: NotificationPayload,
): NotificationContent {
	switch (payload.notifyType) {
		case "member.invited":
			return content(
				"memberInvited",
				{ invitedBy: payload.invitedBy, workspaceSlug: payload.workspaceSlug },
				"/team",
			);
		case "member.joined":
			return content(
				"memberJoined",
				{
					memberUsername: payload.memberUsername,
					workspaceSlug: payload.workspaceSlug,
				},
				"/team",
			);
		case "connection.sync.completed":
			return content(
				"connectionSyncCompleted",
				{ recordsSynced: payload.recordsSynced },
				"/integrations/runs",
			);
		case "connection.sync.failed":
			return content(
				"connectionSyncFailed",
				{ error: payload.error },
				"/integrations/runs",
			);
		case "pipeline.run.analyzed":
			return content(
				"pipelineRunAnalyzed",
				{
					pipelineSlug: payload.pipelineSlug,
					inputFileName: payload.inputFileName,
				},
				"/workflows/runs",
			);
		case "pipeline.run.completed":
			return content(
				"pipelineRunCompleted",
				{
					pipelineSlug: payload.pipelineSlug,
					inputFileName: payload.inputFileName,
				},
				"/workflows/runs",
			);
		case "pipeline.run.failed":
			return content(
				"pipelineRunFailed",
				{
					pipelineSlug: payload.pipelineSlug,
					inputFileName: payload.inputFileName,
					error: payload.error,
				},
				"/workflows/runs",
			);
		case "system.announcement":
			return content("systemAnnouncement", { message: payload.message });
		case "system.report":
			return content("systemReport", { reportId: payload.reportId });
	}
}

function content(
	key: string,
	params: Record<string, unknown>,
	to?: string,
): NotificationContent {
	return {
		titleKey: `notifications.events.${key}.title`,
		messageKey: `notifications.events.${key}.message`,
		params,
		...(to ? { to } : {}),
	};
}
