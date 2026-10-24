import type { Nvisy } from "@nvisy/sdk";
import type { Repository } from "./types";

/*
 * The server-backed repository: the SDK path the console has always used. It is
 * the default everywhere, and the only path on the web. On desktop it is used
 * when signed in; the local repository takes over when there is no session.
 *
 * Because each seam resource is typed as the SDK resource itself, the server
 * implementation is just the client's resources — no adapter layer.
 */

/** Build a server-backed repository over an SDK client. */
export function createServerRepository(client: Nvisy): Repository {
	return {
		policies: client.policies,
		documents: client.documents,
		// Notification settings live on the SDK's `workspaces` resource.
		notificationSettings: client.workspaces,
	};
}
