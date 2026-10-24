import type { Nvisy } from "@nvisy/sdk";
import type {
	UseMutationOptions,
	UseQueryOptions,
	UseQueryReturn,
} from "@pinia/colada";
import type { Repository } from "#console/repositories/types";

/**
 * Shared plumbing for the workspace-scoped data composables. Every one of them
 * needs the same three things — the SDK client, the active workspace slug, and
 * a "not authenticated / no workspace" guard — plus the same query `key` +
 * `enabled` shape and refresh-on-success wiring. This module owns that so the
 * individual composables read as just their resource calls.
 */

/**
 * The resolved context a workspace-scoped call needs.
 *
 * `client` is the SDK client, guaranteed non-null here — composables not yet
 * routed through the repository seam call it directly, and those run only on the
 * server-backed path (a live session). `repository` is the seam a routed
 * composable calls instead; see {@link requireRepository} for the offline path
 * that does not require a client.
 */
export interface WorkspaceContext {
	client: Nvisy;
	workspaceId: string;
}

/**
 * The resolved context a repository-routed call needs: the data source and the
 * workspace, with no client requirement — so it works offline, backed by the
 * local store.
 */
export interface RepositoryContext {
	repository: Repository;
	workspaceId: string;
}

/**
 * Resolve the SDK client / repository + active workspace id, or throw a single
 * canonical error. Use inside a query/mutation body where a workspace is
 * required. The URL is still keyed by slug (display-only); this resolves it to
 * the id every call now takes.
 */
export function useWorkspaceContext() {
	const { $nvisyClient } = useNuxtApp();
	const { currentWorkspaceId } = useWorkspaces();
	const { repository } = useRepository();

	/**
	 * The client-backed context, for composables not yet routed through the
	 * repository. Requires a session, so it is only reached on the server path.
	 */
	function requireContext(): WorkspaceContext {
		const client = $nvisyClient.value;
		const workspaceId = currentWorkspaceId.value;
		if (!client) throw new Error("Not authenticated");
		if (!workspaceId) throw new Error("No workspace selected");
		return { client, workspaceId };
	}

	/**
	 * The repository-backed context, for routed composables. Needs no session —
	 * the local store backs it offline.
	 */
	function requireRepository(): RepositoryContext {
		const repo = repository.value;
		const workspaceId = currentWorkspaceId.value;
		if (!repo) throw new Error("No data source available");
		if (!workspaceId) throw new Error("No workspace selected");
		return { repository: repo, workspaceId };
	}

	/**
	 * True once a data source (server or local) and a workspace id are both
	 * resolved. A local repository needs no session, so this no longer gates on
	 * authentication — the desktop app lists and edits local data logged out.
	 */
	const enabled = () => !!repository.value && !!currentWorkspaceId.value;

	/** Query key scoped to the active workspace: `[resource, id, ...extra]`. */
	const key =
		(resource: string, ...extra: Array<string | number | null>) =>
		() => [resource, currentWorkspaceId.value, ...extra];

	return {
		requireContext,
		requireRepository,
		enabled,
		key,
		currentWorkspaceId,
	};
}

/**
 * A `useQuery` scoped to the active workspace. The fetcher receives the
 * resolved `{ client, workspaceSlug }`; the key and `enabled` predicate are
 * wired automatically. Extra `useQuery` options (`extraKey`, `staleTime`, …)
 * pass through.
 *
 * @param resource - Stable resource name used as the first key segment.
 * @param fetch - Fetcher, given the resolved workspace context.
 */
export function workspaceQuery<T>(
	resource: string,
	fetch: (ctx: WorkspaceContext) => Promise<T>,
	options?: Partial<UseQueryOptions<T>>,
): UseQueryReturn<T> {
	const { requireContext, enabled, key } = useWorkspaceContext();
	return useQuery<T>({
		key: key(resource),
		query: () => fetch(requireContext()),
		enabled,
		...options,
	});
}

/** Options for {@link workspaceMutation}. Mirrors colada's hooks, ctx-aware. */
interface WorkspaceMutationOptions<T, V> {
	/**
	 * Resource name(s) whose workspace-scoped query to invalidate on success.
	 *
	 * Invalidation goes through the query cache by key (`[resource, slug]`), not
	 * by refreshing a specific query instance. This matters: the mutation may run
	 * from a page that never subscribed to the list query (e.g. creating a policy
	 * from the templates page), and a bare `instance.refresh()` there leaves the
	 * cached entry the *destination* page reads still marked fresh — so the first
	 * insert into an empty list never shows until a manual reload. Marking the
	 * entry stale by key makes the next mount refetch regardless of who mutated.
	 */
	invalidates?: string | string[];
	onMutate?: UseMutationOptions<T, V>["onMutate"];
	onSuccess?: UseMutationOptions<T, V>["onSuccess"];
	onSettled?: UseMutationOptions<T, V>["onSettled"];
	onError?: UseMutationOptions<T, V>["onError"];
}

/**
 * A `useMutation` scoped to the active workspace. The mutator receives the
 * resolved context and the mutation variables. Pass `invalidates` (resource
 * name[s]) to mark the matching workspace-scoped queries stale on success; the
 * optimistic lifecycle hooks pass straight through.
 *
 * @param mutate - Mutator, given the workspace context and the variables.
 */
export function workspaceMutation<T, V = void>(
	mutate: (ctx: WorkspaceContext, variables: V) => Promise<T>,
	options: WorkspaceMutationOptions<T, V> = {},
) {
	const { requireContext, key } = useWorkspaceContext();
	const queryCache = useQueryCache();
	const { invalidates, onSuccess, onSettled, ...rest } = options;
	const resources =
		invalidates == null
			? []
			: Array.isArray(invalidates)
				? invalidates
				: [invalidates];

	return useMutation<T, V>({
		mutation: (variables: V) => mutate(requireContext(), variables),
		onSuccess(...args) {
			for (const resource of resources) {
				queryCache.invalidateQueries({ key: key(resource)() });
			}
			onSuccess?.(...args);
		},
		onSettled,
		...rest,
	});
}

/**
 * A {@link workspaceQuery} routed through the repository seam: the fetcher
 * receives `{ repository, workspaceId }` and needs no session, so it reads from
 * the local store when offline and the server when signed in.
 */
export function repositoryQuery<T>(
	resource: string,
	fetch: (ctx: RepositoryContext) => Promise<T>,
	options?: Partial<UseQueryOptions<T>>,
): UseQueryReturn<T> {
	const { requireRepository, enabled, key } = useWorkspaceContext();
	return useQuery<T>({
		key: key(resource),
		query: () => fetch(requireRepository()),
		enabled,
		...options,
	});
}

/**
 * A {@link workspaceMutation} routed through the repository seam: the mutator
 * receives `{ repository, workspaceId }` and the variables, and needs no
 * session.
 */
export function repositoryMutation<T, V = void>(
	mutate: (ctx: RepositoryContext, variables: V) => Promise<T>,
	options: WorkspaceMutationOptions<T, V> = {},
) {
	const { requireRepository, key } = useWorkspaceContext();
	const queryCache = useQueryCache();
	const { invalidates, onSuccess, onSettled, ...rest } = options;
	const resources =
		invalidates == null
			? []
			: Array.isArray(invalidates)
				? invalidates
				: [invalidates];

	return useMutation<T, V>({
		mutation: (variables: V) => mutate(requireRepository(), variables),
		onSuccess(...args) {
			for (const resource of resources) {
				queryCache.invalidateQueries({ key: key(resource)() });
			}
			onSuccess?.(...args);
		},
		onSettled,
		...rest,
	});
}
