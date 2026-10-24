import type { Repository } from "#console/repositories/types";
import { createDocumentsRepository } from "./documents";
import { createNotificationSettingsRepository } from "./notification-settings";
import { createPoliciesRepository } from "./policies";

/*
 * The local, store-backed repository: the within-workspace data source for a
 * local folder-workspace. It assembles one resource per entity, each in its own
 * file and built on the generic `store` client. Workspace listing/lifecycle is
 * NOT here — it lives in the workspace-list seam (`createLocalWorkspaceList`),
 * because the list is a union of local and server workspaces. The shared layer
 * never imports this; a desktop-only plugin injects it per workspace.
 */

/** Build the local, store-backed repository for a folder-workspace. */
export function createLocalRepository(): Repository {
	return {
		policies: createPoliciesRepository(),
		documents: createDocumentsRepository(),
		notificationSettings: createNotificationSettingsRepository(),
	};
}
