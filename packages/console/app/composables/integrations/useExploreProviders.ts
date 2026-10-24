import type {
	ExploreCategory,
	ExploreProvider,
	TagKey,
} from "#console/utils/connections";
import {
	CATEGORIES,
	PROVIDERS,
	fileServiceForCard,
	llmProviderForCard,
	storageProviderForCard,
} from "#console/utils/connections";

/**
 * A connectable's three states, distinct because they mean different things to
 * the user:
 *  - `available`:    can be connected now (Connect button).
 *  - `unconfigured`: a provider Nvisy supports, but this deployment hasn't set
 *    it up (no OAuth app / family disabled in the connector catalog). Common on
 *    self-hosted deployments. NOT "coming soon" - it exists, it's just not
 *    wired up here.
 *  - `comingSoon`:   not built yet (bots), genuinely on the roadmap.
 */
export type Availability = "available" | "unconfigured" | "comingSoon";

/** The localized, availability-resolved shape a `ProviderCard` renders. */
export interface CardProvider {
	id: string;
	name: string;
	description: string;
	shortDescription?: string;
	icon: string;
	kind: ExploreProvider["kind"];
	availability: Availability;
	tags: string[];
	isNew?: boolean;
	isExternal?: boolean;
	externalUrl?: string;
}

type StatusFilter = "all" | "available" | "unavailable";
type SortBy = "nameAsc" | "nameDesc";

/** One category pill: the leading "All" (empty key) plus one per category. */
export interface CategoryPill {
	key: string;
	label: string;
	icon: ExploreCategory["icon"] | null;
	count: number;
}

/**
 * The explore page's view logic: search/category/status/sort filters over the
 * static provider {@link PROVIDERS} catalog, each provider's effective
 * availability (resolved against the deployment's connector catalog), and the
 * two mapped card lists the page renders. The page owns only the filter widgets
 * and the connect flow; everything derived lives here.
 */
export function useExploreProviders() {
	const { t } = useI18n();
	const { objectStoresAvailable, inferenceAvailable, fileServiceAvailable } =
		useConnectorCatalog();

	// Filter state (page-local; bound to the toolbar widgets).
	const searchQuery = ref("");
	const selectedCategories = ref<Set<string>>(new Set());
	const statusFilter = ref<StatusFilter>("all");
	const sortBy = ref<SortBy>("nameAsc");

	const query = computed(() => searchQuery.value.toLowerCase().trim());
	const hasActiveFilters = computed(
		() =>
			!!searchQuery.value ||
			selectedCategories.value.size > 0 ||
			statusFilter.value !== "all",
	);

	// Localization helpers.
	const providerName = (p: ExploreProvider) => t(p.nameKey);
	const providerDescription = (p: ExploreProvider) => t(p.descriptionKey);
	const providerShortDescription = (p: ExploreProvider) =>
		p.shortDescriptionKey ? t(p.shortDescriptionKey) : undefined;
	const tagName = (tag: TagKey) => t(`connections.explore.tags.${tag}`);

	// A connectable card's SDK-backed family availability, or null when it has no
	// SDK path yet (the bots). The catalog gates the former; the latter are
	// coming-soon.
	function catalogAvailable(provider: ExploreProvider): boolean | null {
		const fileProvider = fileServiceForCard(provider.id);
		if (fileProvider) return fileServiceAvailable(fileProvider);
		if (storageProviderForCard(provider.id)) return objectStoresAvailable.value;
		if (llmProviderForCard(provider.id)) return inferenceAvailable.value;
		return null;
	}

	function availabilityOf(provider: ExploreProvider): Availability {
		if (provider.kind !== "connectable") {
			return provider.status === "available" ? "available" : "comingSoon";
		}
		const gated = catalogAvailable(provider);
		// SDK-backed: the catalog decides available vs. supported-but-unconfigured.
		if (gated !== null) return gated ? "available" : "unconfigured";
		// No SDK path yet (bots): genuinely coming soon.
		return "comingSoon";
	}

	function toCard(provider: ExploreProvider): CardProvider {
		return {
			id: provider.id,
			name: providerName(provider),
			description: providerDescription(provider),
			shortDescription: providerShortDescription(provider),
			icon: provider.icon,
			kind: provider.kind,
			availability: availabilityOf(provider),
			tags: provider.tags.map(tagName),
			isNew: provider.isNew,
			isExternal: provider.isExternal,
			externalUrl: provider.externalUrl,
		};
	}

	// Free-text match over a provider's localized name, description, and tags.
	function matchesSearch(provider: ExploreProvider): boolean {
		if (!query.value) return true;
		const haystack = [
			providerName(provider),
			providerDescription(provider),
			...provider.tags.map(tagName),
		]
			.join(" ")
			.toLowerCase();
		return haystack.includes(query.value);
	}

	// The status filter only applies to connectable providers; recommendations
	// are always reachable. "unavailable" covers both unconfigured and coming-soon.
	function matchesStatus(provider: ExploreProvider): boolean {
		const available = availabilityOf(provider) === "available";
		if (statusFilter.value === "available") return available;
		if (statusFilter.value === "unavailable") return !available;
		return true;
	}

	// Order: available first (the actionable ones), then the rest, then by name
	// within each group per the sort selector.
	function byGroupThenName(a: ExploreProvider, b: ExploreProvider): number {
		const aAvail = availabilityOf(a) === "available";
		const bAvail = availabilityOf(b) === "available";
		if (aAvail !== bAvail) return aAvail ? -1 : 1;
		const cmp = providerName(a).localeCompare(providerName(b));
		return sortBy.value === "nameDesc" ? -cmp : cmp;
	}

	// Connectable providers passing search + status but not the category pills.
	// Shared by the region list and the per-category pill counts.
	const connectableMatches = computed(() =>
		PROVIDERS.filter(
			(p) => p.kind === "connectable" && matchesStatus(p) && matchesSearch(p),
		),
	);

	// Connectable region: adds the category-pill filter, sorts, maps to cards.
	const connectableCards = computed(() =>
		connectableMatches.value
			.filter(
				(p) =>
					selectedCategories.value.size === 0 ||
					selectedCategories.value.has(p.category),
			)
			.sort(byGroupThenName)
			.map(toCard),
	);

	// Recommendation region: external routes. Only search applies.
	const recommendationCards = computed(() =>
		PROVIDERS.filter((p) => p.kind === "recommendation")
			.filter(matchesSearch)
			.sort(byGroupThenName)
			.map(toCard),
	);

	const noResults = computed(
		() =>
			connectableCards.value.length === 0 &&
			recommendationCards.value.length === 0,
	);

	// The pill row: a leading "All" (empty key = selection cleared) plus one pill
	// per category, each with its live count (search + status, not the category
	// selection itself, so each shows how many it would reveal).
	const pills = computed<CategoryPill[]>(() => {
		const countIn = (key: string) =>
			connectableMatches.value.filter((p) => p.category === key).length;
		return [
			{
				key: "",
				label: t("connections.explore.allCategories"),
				icon: null,
				count: connectableMatches.value.length,
			},
			...CATEGORIES.map((c) => ({
				key: c.key,
				label: t(c.nameKey),
				icon: c.icon,
				count: countIn(c.key),
			})),
		];
	});

	const isPillActive = (key: string) =>
		key === ""
			? selectedCategories.value.size === 0
			: selectedCategories.value.has(key);

	function togglePill(key: string) {
		if (key === "") {
			selectedCategories.value = new Set();
			return;
		}
		const next = new Set(selectedCategories.value);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		selectedCategories.value = next;
	}

	function clearAllFilters() {
		searchQuery.value = "";
		selectedCategories.value = new Set();
		statusFilter.value = "all";
	}

	return {
		// Filter state
		searchQuery,
		statusFilter,
		sortBy,
		hasActiveFilters,
		// Derived lists
		connectableCards,
		recommendationCards,
		noResults,
		// Category pills
		pills,
		isPillActive,
		togglePill,
		// Actions
		clearAllFilters,
	};
}
