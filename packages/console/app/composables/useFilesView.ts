import type {
	FormatToken,
	ListFiles,
	ModalityToken,
} from "@nvisy/sdk/datatypes";

/**
 * Shared view state for the Files page: search, filters, and the list/grid
 * toggle, plus the derived `listFiles` query. Held at module scope so the page
 * body and the header controls (rendered separately, in the app header) read
 * and write the same state — the way the studio shares its open-files store.
 *
 * Data fetching, selection, and dialogs stay in the page; this owns only what
 * both the header and the body need.
 */

const searchQuery = ref("");
const selectedModalities = ref<ModalityToken[]>([]);
const selectedFormats = ref<FormatToken[]>([]);
const viewMode = ref<"list" | "grid">("list");
// Shared upload trigger: the header button flips this; the page binds the
// upload dialog's open state to it.
const uploadOpen = ref(false);
// Shared import trigger: the header button flips this; the page binds the
// import-from-connection dialog's open state to it.
const importOpen = ref(false);
// When an import was started from elsewhere (the integrations page navigates to
// Files afterwards), the timestamp it started. The Files page reads it on mount
// to poll for the incoming files, then clears it.
const importStartedAt = ref<number | null>(null);

/** Modality tokens offered in the filter, in display order. */
export const MODALITY_TOKENS: ModalityToken[] = [
	"text",
	"image",
	"tabular",
	"audio",
];

/** Format tokens offered in the filter, in display order. */
export const FORMAT_TOKENS: FormatToken[] = [
	"csv",
	"docx",
	"htm",
	"html",
	"jpeg",
	"jpg",
	"json",
	"log",
	"pdf",
	"png",
	"rtf",
	"tif",
	"tiff",
	"txt",
	"wav",
	"xlsx",
	"xml",
];

export function useFilesView() {
	const { t } = useI18n();

	// Server-side filtering: fold search + filters into the listFiles query.
	const filesQuery = computed<ListFiles>(() => ({
		...(searchQuery.value.trim() && { search: searchQuery.value.trim() }),
		...(selectedModalities.value.length && {
			modality: selectedModalities.value,
		}),
		...(selectedFormats.value.length && { formats: selectedFormats.value }),
	}));

	const modalityOptions = computed(() =>
		MODALITY_TOKENS.map((value) => ({
			value,
			label: t(`files.filters.modalities.${value}`),
		})),
	);
	const formatOptions = FORMAT_TOKENS.map((value) => ({ value, label: value }));

	const hasFilters = computed(
		() =>
			searchQuery.value.trim().length > 0 ||
			selectedModalities.value.length > 0 ||
			selectedFormats.value.length > 0,
	);

	function clearFilters() {
		searchQuery.value = "";
		selectedModalities.value = [];
		selectedFormats.value = [];
	}

	function openUpload() {
		uploadOpen.value = true;
	}

	function openImport() {
		importOpen.value = true;
	}

	// Mark that an import just started, for a Files page mounting after a navigation
	// from elsewhere (the integrations connection row) to pick up.
	function markImportStarted() {
		importStartedAt.value = Date.now();
	}

	// Consume the pending-import marker (returns whether one was set, and clears
	// it), so the Files page polls exactly once after the navigation.
	function takeImportStarted(): boolean {
		const started = importStartedAt.value !== null;
		importStartedAt.value = null;
		return started;
	}

	return {
		searchQuery,
		selectedModalities,
		selectedFormats,
		viewMode,
		uploadOpen,
		importOpen,
		filesQuery,
		modalityOptions,
		formatOptions,
		hasFilters,
		clearFilters,
		openUpload,
		openImport,
		markImportStarted,
		takeImportStarted,
	};
}
