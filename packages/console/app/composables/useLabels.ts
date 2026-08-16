import type { Label, LabelCatalog, LabelLocale } from "@nvisy/sdk/datatypes";

/** A reference to a label by its catalog id. The SDK models this as a string. */
type LabelRef = string;

/**
 * The deployment's built-in (global) label taxonomy, sourced from
 * `GET /catalog/labels/`. This is the shared vocabulary a policy references by
 * id via `Labels.builtins`; a policy's effective set is these globals plus its
 * own inline `Labels.custom` labels.
 *
 * The catalog is immutable on the server — it changes only when the deployment
 * is updated — so it is fetched once and cached for the whole session
 * (`staleTime: Infinity`). Call `refresh()` after a known server update to pull
 * a new taxonomy.
 */
export function useLabels() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { locale } = useI18n();

	const query = useQuery<LabelCatalog>({
		key: ["catalog", "labels"],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.catalog.listLabels();
		},
		enabled: () => !!authToken.value?.apiToken,
		// The taxonomy is server-immutable; never auto-refetch within a session.
		staleTime: Number.POSITIVE_INFINITY,
	});

	const catalog = computed<LabelCatalog>(() => query.data.value ?? {});

	/** Pick a label's localized text: current locale, then English, then any. */
	function pickLocale(label: Label): LabelLocale | undefined {
		const l = label.localizations;
		return l[locale.value] ?? l.en ?? Object.values(l)[0];
	}

	/** A label's display name in the active locale (falls back to its id). */
	function labelName(ref: LabelRef): string {
		const label = catalog.value[ref];
		if (!label) return ref;
		return pickLocale(label)?.name ?? ref;
	}

	/** A label's localized description, when one is defined. */
	function labelDescription(ref: LabelRef): string | undefined {
		const label = catalog.value[ref];
		return label ? pickLocale(label)?.description : undefined;
	}

	/** The full label for a ref, or undefined if it isn't in the catalog. */
	function resolveLabel(ref: LabelRef): Label | undefined {
		return catalog.value[ref];
	}

	// All labels as an array, sorted by localized name for stable list order.
	const labels = computed<Label[]>(() =>
		Object.values(catalog.value).sort((a, b) =>
			(pickLocale(a)?.name ?? a.id).localeCompare(
				pickLocale(b)?.name ?? b.id,
				locale.value,
			),
		),
	);

	// Labels grouped by category, for a grouped picker. Uncategorized labels
	// fall under an empty-string key so callers can render them last.
	const labelsByCategory = computed<Record<string, Label[]>>(() => {
		const groups: Record<string, Label[]> = {};
		for (const label of labels.value) {
			const category = label.category ?? "";
			const bucket = groups[category];
			if (bucket) bucket.push(label);
			else groups[category] = [label];
		}
		return groups;
	});

	return {
		// Query state
		catalog,
		labels,
		labelsByCategory,
		isLoading: query.isLoading,
		error: query.error,
		refresh: query.refresh,

		// Resolvers
		labelName,
		labelDescription,
		resolveLabel,
	};
}
