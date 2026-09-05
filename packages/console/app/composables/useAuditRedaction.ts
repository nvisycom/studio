import type { MaybeRefOrGetter } from "vue";
import type {
	CategorizedGroup,
	EntityCluster,
} from "#console/composables/useEntities";
import type { StudioEntityView } from "#console/composables/useStudioEntities";

/**
 * The reviewer's keep/redact decision model, shared by both audit surfaces (the
 * wide review {@link StudioAuditTable} and the compact {@link StudioAuditPanel})
 * so they stay in exact agreement. A finding is "redacted" unless the reviewer
 * kept (suppressed) it, so a checkbox reads as the action: checked = will redact.
 *
 * The decision state lives on the redaction composable (the `suppressed` set);
 * this only derives from it and drives toggles back out through `toggleSuppress`,
 * one entity at a time. Cluster / category toggles move a whole group to a single
 * target (only flipping the ones that differ) so a mixed group resolves cleanly.
 *
 * The "expand duplicate occurrences" UI state (which clustered rows are open) also
 * lives here, since both views expose the same disclosure.
 */
export function useAuditRedaction(
	suppressed: MaybeRefOrGetter<Set<string> | undefined>,
	toggleSuppress: (id: string) => void,
) {
	const willRedact = (id: string) => !toValue(suppressed)?.has(id);

	// Drive a set of entities to one redact/keep target, flipping only the ones
	// that differ so a group moves together without any flip-flopping.
	function setRedact(entities: { id: string }[], redact: boolean) {
		for (const e of entities) {
			if (willRedact(e.id) !== redact) toggleSuppress(e.id);
		}
	}

	const clusterAnyRedact = (cluster: EntityCluster<StudioEntityView>) =>
		cluster.items.some((e) => willRedact(e.id));
	const clusterAllRedact = (cluster: EntityCluster<StudioEntityView>) =>
		cluster.items.every((e) => willRedact(e.id));
	// Checked when every occurrence will redact; indeterminate on a mix.
	function clusterChecked(
		cluster: EntityCluster<StudioEntityView>,
	): boolean | "indeterminate" {
		if (clusterAllRedact(cluster)) return true;
		if (clusterAnyRedact(cluster)) return "indeterminate";
		return false;
	}
	// Toggle drives the whole cluster to redact unless it's already fully redacting.
	const toggleCluster = (cluster: EntityCluster<StudioEntityView>) =>
		setRedact(cluster.items, !clusterAllRedact(cluster));

	const categoryEntities = (group: CategorizedGroup<StudioEntityView>) =>
		group.labels.flatMap((l) => l.items);
	function categoryChecked(
		group: CategorizedGroup<StudioEntityView>,
	): boolean | "indeterminate" {
		const items = categoryEntities(group);
		const redacting = items.filter((e) => willRedact(e.id)).length;
		if (redacting === 0) return false;
		if (redacting === items.length) return true;
		return "indeterminate";
	}
	const toggleCategory = (group: CategorizedGroup<StudioEntityView>) =>
		setRedact(
			categoryEntities(group),
			!categoryEntities(group).every((e) => willRedact(e.id)),
		);

	const expanded = ref<Set<string>>(new Set());
	const isExpanded = (key: string) => expanded.value.has(key);
	function toggleExpand(key: string) {
		const next = new Set(expanded.value);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		expanded.value = next;
	}

	return {
		willRedact,
		setRedact,
		clusterAnyRedact,
		clusterAllRedact,
		clusterChecked,
		toggleCluster,
		categoryEntities,
		categoryChecked,
		toggleCategory,
		expanded,
		isExpanded,
		toggleExpand,
	};
}
