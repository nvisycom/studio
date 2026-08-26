import type { NotificationPayload } from "@nvisy/sdk/datatypes";

/**
 * A notification's human-readable content, expressed as i18n descriptors so
 * the caller renders it: `t(titleKey)` and `t(messageKey, params)`.
 *
 * The API no longer ships a pre-rendered title/message — each notification
 * carries a typed {@link NotificationPayload} discriminated by `type`, with the
 * event data under a nested `data` object, and the client turns it into copy.
 * Keeping that mapping here (rather than in the dropdown) keeps the component
 * declarative and the strings in one place.
 */
export interface NotificationContent {
	titleKey: string;
	messageKey: string;
	params: Record<string, unknown>;
	/**
	 * Where clicking the notification takes the user, as a workspace-relative
	 * path (the caller prefixes it with the current workspace link).
	 */
	to?: string;
}

/**
 * Map a notification payload to its i18n title/message descriptors and a target
 * route.
 *
 * Keys live under `notifications.events.<key>` in the locale files, with the
 * dots in the event name flattened to a dot-free segment (e.g.
 * `connection.sync.completed` → `connectionSyncCompleted`).
 */
export function notificationContent(
	payload: NotificationPayload,
): NotificationContent {
	const { type } = payload;
	switch (type) {
		case "member.invited":
			return content("memberInvited", payload.data, "/team");
		case "member.joined":
			return content("memberJoined", payload.data, "/team");
		case "connection.sync.completed":
			return content(
				"connectionSyncCompleted",
				payload.data,
				"/integrations/runs",
			);
		case "connection.sync.failed":
			return content(
				"connectionSyncFailed",
				payload.data,
				"/integrations/runs",
			);
		case "pipeline.detection.completed":
			return content(
				"pipelineDetectionCompleted",
				payload.data,
				"/workflows/detections",
			);
		case "pipeline.detection.failed":
			return content(
				"pipelineDetectionFailed",
				payload.data,
				"/workflows/detections",
			);
		case "pipeline.redaction.created":
			return content(
				"pipelineRedactionCreated",
				payload.data,
				"/workflows/detections",
			);
		// Version skew: a newer API can emit a `type` outside the pinned SDK
		// union. Fall back to a generic entry so the notification still renders
		// (no route — we can't know where an unknown event should link).
		default:
			return content("unknown", { type: type as string });
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
