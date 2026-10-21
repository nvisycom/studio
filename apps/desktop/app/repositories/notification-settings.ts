import { invoke } from "@tauri-apps/api/core";
import type {
	NotificationEvent,
	UpdateWorkspaceNotificationSettings,
	WorkspaceNotificationSettings,
} from "@nvisy/sdk/datatypes";
import type { Repository } from "#console/repositories/types";

/*
 * The notification-settings resource of the local store: the per-event
 * preferences for a local workspace, persisted on-device (the Tauri settings
 * store, via the `notification_prefs` commands).
 *
 * A local workspace only has the pipeline events — detection completed/failed
 * and redaction created, which the studio fires in-session. There are no member,
 * review, or connection events locally, so those never appear. The native
 * (device) channel is the only delivery channel, carried by `notificationEventsApp`
 * (the "in-app/native" list); email has no local meaning and stays off.
 *
 * Settings are device-scoped (one set per device), not per-workspace: the
 * `workspaceId` argument is accepted to match the SDK signature but ignored, so
 * the preference follows the device the way the native on/off toggle does.
 */

/** The locally-meaningful events — enabled by default, like a fresh account. */
const LOCAL_EVENTS: NotificationEvent[] = [
	"pipeline.detection.completed",
	"pipeline.detection.failed",
	"pipeline.redaction.created",
];

/** The default settings for a local workspace: all local events on, email off. */
function defaults(): WorkspaceNotificationSettings {
	return {
		notificationEventsApp: [...LOCAL_EVENTS],
		notificationEventsEmail: [],
		notifyViaEmail: false,
	};
}

/** Keep only the locally-meaningful events (drop any server-only ones that a
 *  stored blob might carry). */
function localOnly(
	events: NotificationEvent[] | undefined,
): NotificationEvent[] {
	return (events ?? []).filter((e) => LOCAL_EVENTS.includes(e));
}

/** The local store's notification-settings resource. */
export function createNotificationSettingsRepository(): Repository["notificationSettings"] {
	async function read(): Promise<WorkspaceNotificationSettings> {
		const stored = await invoke<WorkspaceNotificationSettings | null>(
			"notification_prefs",
		);
		if (!stored) return defaults();
		// Keep only the local events, so a change in what's "local" can't surface a
		// stale server-only event.
		return {
			notificationEventsApp: localOnly(stored.notificationEventsApp),
			notificationEventsEmail: [],
			notifyViaEmail: false,
		};
	}

	return {
		getNotificationSettings: async (
			_workspaceId: string,
		): Promise<WorkspaceNotificationSettings> => read(),

		updateNotificationSettings: async (
			_workspaceId: string,
			updates: UpdateWorkspaceNotificationSettings,
		): Promise<WorkspaceNotificationSettings> => {
			const current = await read();
			const next: WorkspaceNotificationSettings = {
				// Only the native/in-app event list is meaningful locally; email stays
				// off regardless of what's sent.
				notificationEventsApp:
					updates.notificationEventsApp !== undefined
						? localOnly(updates.notificationEventsApp)
						: current.notificationEventsApp,
				notificationEventsEmail: [],
				notifyViaEmail: false,
			};
			await invoke("set_notification_prefs", { prefs: next });
			return next;
		},
	};
}
