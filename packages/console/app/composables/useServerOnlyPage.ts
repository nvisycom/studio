/**
 * Guard a page that only works for a SERVER workspace (reviews, team, webhooks,
 * integrations, analytics, account pages — anything whose data is server-backed
 * with no local equivalent).
 *
 * These pages are hidden from the nav for a local folder-workspace, but their
 * routes are still reachable directly (a bookmark, the command menu, a stale
 * link). Reached on a local workspace they would error or hang, so this redirects
 * out to the workspace home instead.
 *
 * Reactive on purpose: middleware can't do this cleanly because the workspace
 * list (which tells us the active workspace is local) usually isn't loaded yet
 * when route middleware runs. A `watchEffect` re-evaluates once the list
 * resolves, so the redirect fires as soon as "local" becomes known — with no
 * flash of the server page's error state in the common case.
 *
 * Call once in a server-only page's `<script setup>`:
 *
 * ```ts
 * useServerOnlyPage();
 * ```
 */
export function useServerOnlyPage(): void {
	const { currentWorkspaceIsLocal } = useWorkspaces();
	const { wLink } = useWorkspaceLink();

	watchEffect(() => {
		if (currentWorkspaceIsLocal.value) navigateTo(wLink("/"));
	});
}
