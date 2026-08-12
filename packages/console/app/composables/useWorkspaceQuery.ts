import type { Nvisy } from "@nvisy/sdk";
import type {
	UseMutationOptions,
	UseQueryOptions,
	UseQueryReturn,
} from "@pinia/colada";

/**
 * Shared plumbing for the workspace-scoped data composables. Every one of them
 * needs the same three things — the SDK client, the active workspace slug, and
 * a "not authenticated / no workspace" guard — plus the same query `key` +
 * `enabled` shape and refresh-on-success wiring. This module owns that so the
 * individual composables read as just their resource calls.
 */

/** The resolved context every workspace-scoped call needs. */
export interface WorkspaceContext {
	client: Nvisy;
	workspaceSlug: string;
}

/**
 * Resolve the SDK client + active workspace slug, or throw a single canonical
 * error. Use inside a query/mutation body where a workspace is required.
 */
export function useWorkspaceContext() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceSlug } = useWorkspaces();

	function requireContext(): WorkspaceContext {
		const client = $nvisyClient.value;
		const workspaceSlug = currentWorkspaceSlug.value;
		if (!client) throw new Error("Not authenticated");
		if (!workspaceSlug) throw new Error("No workspace selected");
		return { client, workspaceSlug };
	}

	/** True once both a token and a workspace are available. */
	const enabled = () =>
		!!authToken.value?.apiToken && !!currentWorkspaceSlug.value;

	/** Query key scoped to the active workspace: `[resource, slug, ...extra]`. */
	const key =
		(resource: string, ...extra: Array<string | number | null>) =>
		() => [resource, currentWorkspaceSlug.value, ...extra];

	return { requireContext, enabled, key, currentWorkspaceSlug };
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
