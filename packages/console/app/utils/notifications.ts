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
}

/**
 * Map a notification payload to its i18n title/message descriptors.
 *
 * Keys live under `notifications.events.<notifyType>` in the locale files,
 * with the colon/dot in the event name flattened to a dot-free segment
 * (e.g. `connection:sync.completed` → `connectionSyncCompleted`).
 */
export function notificationContent(
	payload: NotificationPayload,
): NotificationContent {
	switch (payload.notifyType) {
		case "member:invited":
			return content("memberInvited", {
				invitedBy: payload.invitedBy,
				workspaceSlug: payload.workspaceSlug,
			});
		case "member:joined":
			return content("memberJoined", {
				memberUsername: payload.memberUsername,
				workspaceSlug: payload.workspaceSlug,
			});
		case "connection:sync.completed":
			return content("connectionSyncCompleted", {
				recordsSynced: payload.recordsSynced,
			});
		case "connection:sync.failed":
			return content("connectionSyncFailed", { error: payload.error });
		case "pipeline:run.analyzed":
			return content("pipelineRunAnalyzed", {
				pipelineSlug: payload.pipelineSlug,
				inputFileName: payload.inputFileName,
			});
		case "pipeline:run.completed":
			return content("pipelineRunCompleted", {
				pipelineSlug: payload.pipelineSlug,
				inputFileName: payload.inputFileName,
			});
		case "pipeline:run.failed":
			return content("pipelineRunFailed", {
				pipelineSlug: payload.pipelineSlug,
				inputFileName: payload.inputFileName,
				error: payload.error,
			});
		case "system:announcement":
			return content("systemAnnouncement", { message: payload.message });
		case "system:report":
			return content("systemReport", { reportId: payload.reportId });
	}
}

function content(
	key: string,
	params: Record<string, unknown>,
): NotificationContent {
	return {
		titleKey: `notifications.events.${key}.title`,
		messageKey: `notifications.events.${key}.message`,
		params,
	};
}
