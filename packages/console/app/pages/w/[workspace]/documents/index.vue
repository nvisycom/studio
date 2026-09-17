<script setup lang="ts">
import type {
	WorkspaceConnection,
	WorkspaceDocument as NvisyDocument,
	UpdateWorkspaceDocument,
} from "@nvisy/sdk/datatypes";
import { FileText, Loader2, Upload } from "@lucide/vue";
import { toast } from "vue-sonner";
import {
	AssignDocumentDialog,
	DeleteDocumentDialog,
	EditDocumentDialog,
	DocumentsGridView,
	DocumentsTableView,
	UploadDocumentsDialog,
} from "#console/components/pages/documents";
import {
	ExportToConnectionDialog,
	ImportFromConnectionDialog,
} from "#console/components/pages/integrations";
import { ImportError } from "#console/utils/connections";
import { Button } from "#console/components/ui/button";
import {
	HeaderSocket,
	DocumentsHeaderControls,
} from "#console/components/layout/header";

const { t } = useI18n();
const { wLink } = useWorkspaceLink();

useHead({ title: "Documents" });

definePageMeta({
	pageCategory: "header.category.documents",
	// The controls live in the app header (DocumentsHeaderControls), so reclaim the
	// header's category slot for them.
	hideCategory: true,
});

// Search/filter/view state is shared with the header controls via useDocumentsView.
const {
	viewMode,
	uploadOpen: uploadDialogOpen,
	importOpen: importDialogOpen,
	documentsQuery,
	hasFilters,
	clearFilters,
	takeImportStarted,
} = useDocumentsView();

const {
	documents,
	isLoading,
	error,
	deleteDocumentAsync,
	deleteDocumentsAsync,
	isDeleting,
	updateDocumentAsync,
	isUpdating,
	uploadDocumentsAsync,
	downloadDocument,
	downloadMultiple,
	loadMore,
	hasMore,
	isLoadingMore,
	refresh: refreshDocuments,
} = useDocuments({ query: documentsQuery });

const isDraggingOver = ref(false);

const deleteDialogOpen = ref(false);
const editDialogOpen = ref(false);
const assignDialogOpen = ref(false);
// Files dropped onto the page, handed to the upload dialog so a drop and a
// browse share the same validated flow.
const droppedFiles = ref<File[]>([]);
const documentToDelete = ref<NvisyDocument | null>(null);
const documentToEdit = ref<NvisyDocument | null>(null);
const documentToAssign = ref<NvisyDocument | null>(null);

// Selection — passed whole to the file views; the page reads it for bulk ops.
const documentsSelection = useSelection({
	items: documents,
	getKey: (f) => f.id,
});
const { selected: selectedDocuments, clear: clearSelection } =
	documentsSelection;

const selectedDocumentsCount = computed(() => selectedDocuments.value.size);
const hasSelection = computed(() => selectedDocumentsCount.value > 0);

// Get studio files store
const { openDocument: openDocumentInStudio } = useStudioDocuments();

function viewFile(fileId: string) {
	// Find the file to pass metadata
	const file = documents.value?.find((f) => f.id === fileId);
	openDocumentInStudio(fileId, file);
	navigateTo(wLink("/studio"));
}

function handleBulkOpen() {
	if (!hasSelection.value) return;
	const fileIds = Array.from(selectedDocuments.value);
	// Open each selected file in the studio
	for (const fileId of fileIds) {
		const file = documents.value?.find((f) => f.id === fileId);
		openDocumentInStudio(fileId, file);
	}
	navigateTo(wLink("/studio"));
}

async function handleDownloadFile(file: NvisyDocument) {
	try {
		// On desktop a save can be cancelled (returns false) — don't claim success.
		const saved = await downloadDocument(file.id, file.displayName);
		if (saved) toast.success(t("documents.messages.downloadStarted"));
	} catch {
		toast.error(t("documents.errors.downloadFailed"));
	}
}

async function handleBulkDownload() {
	if (!hasSelection.value) return;
	const { saved, failed } = await downloadMultiple(
		Array.from(selectedDocuments.value),
	);
	// downloadMultiple never throws (per-file errors are tallied). Report by
	// outcome: any failures -> error, otherwise success if anything saved. A
	// pure cancel (nothing saved, nothing failed) stays silent.
	if (failed > 0) {
		toast.error(t("documents.errors.downloadFailed"));
	} else if (saved > 0) {
		toast.success(t("documents.messages.downloadStarted"));
	}
}

// Export to a file-service connection: pick a destination in the dialog, then
// each selected file's redacted output is written there as a new provider file.
const { connections, exportFilesAsync, isExporting } = useConnections();

const exportDialogOpen = ref(false);
const filesToExport = ref<string[]>([]);

// Originals in the export set carry un-redacted contents; the dialog warns
// before sending them to an external service.
const unredactedExportCount = computed(() => {
	const ids = new Set(filesToExport.value);
	return (documents.value ?? []).filter(
		(f) => ids.has(f.id) && f.kind === "original",
	).length;
});

function openExportDialog(fileIds: string[]) {
	if (fileIds.length === 0) return;
	filesToExport.value = fileIds;
	exportDialogOpen.value = true;
}

function handleExportFile(file: NvisyDocument) {
	openExportDialog([file.id]);
}

function handleBulkExport() {
	openExportDialog(Array.from(selectedDocuments.value));
}

async function handleExport(connectionId: string) {
	try {
		await exportFilesAsync({ connectionId, fileIds: filesToExport.value });
		exportDialogOpen.value = false;
		toast.success(t("documents.messages.exportStarted"));
	} catch {
		toast.error(t("documents.errors.exportFailed"));
	}
}

// Import from a file-service connection: pick a source in the dialog, open its
// picker, then import the chosen files. `importFrom` resolves once the server
// accepts the import; the provider files are then fetched by a background sync,
// so a single refresh usually shows nothing. Re-poll for a bounded window so the
// files surface as the sync lands them. A cancelled picker returns 0 (silent).
const { importFrom } = useFileImport();

// Poll the list a few times after an import starts, giving the background sync
// time to land the files without waiting on a manual refresh.
const IMPORT_POLL_INTERVALS_MS = [1500, 3000, 5000, 8000];
function pollAfterImport() {
	for (const delay of IMPORT_POLL_INTERVALS_MS) {
		setTimeout(() => refreshDocuments(), delay);
	}
}

async function handleImport(connection: WorkspaceConnection) {
	try {
		const count = await importFrom(connection);
		if (count > 0) {
			toast.success(t("documents.messages.importStarted", { count }));
			refreshDocuments();
			pollAfterImport();
		}
	} catch (error) {
		// Pickers and the import flow throw ImportError with an i18n key; anything
		// else is unexpected and falls back to the generic failure message.
		const description =
			error instanceof ImportError ? t(error.messageKey) : undefined;
		toast.error(t("documents.errors.importFailed"), { description });
	}
}

// An import started on another page (the integrations connection row) then
// navigated here — poll so its files surface without a manual refresh.
onMounted(() => {
	if (takeImportStarted()) pollAfterImport();
});

function openDeleteDialog(file?: NvisyDocument) {
	documentToDelete.value = file || null;
	deleteDialogOpen.value = true;
}

function openBulkDeleteDialog() {
	documentToDelete.value = null;
	deleteDialogOpen.value = true;
}

async function confirmDelete() {
	try {
		if (documentToDelete.value) {
			await deleteDocumentAsync(documentToDelete.value.id);
			toast.success(t("documents.messages.fileDeleted"));
		} else if (hasSelection.value) {
			// One batch request; the server reports which ids it skipped (unknown,
			// already gone, or held by an in-progress detection).
			const { skipped } = await deleteDocumentsAsync(
				Array.from(selectedDocuments.value),
			);
			if (skipped.length > 0) {
				toast.warning(
					t("documents.messages.filesDeletedPartial", {
						count: skipped.length,
					}),
				);
			} else {
				toast.success(t("documents.messages.filesDeleted"));
			}
			clearSelection();
		}
	} catch {
		toast.error(t("documents.errors.deleteFailed"));
	} finally {
		deleteDialogOpen.value = false;
		documentToDelete.value = null;
	}
}

function openEditDialog(file: NvisyDocument) {
	documentToEdit.value = file;
	editDialogOpen.value = true;
}

function openAssignDialog(file: NvisyDocument) {
	documentToAssign.value = file;
	assignDialogOpen.value = true;
}

async function confirmEdit(data: UpdateWorkspaceDocument) {
	if (!documentToEdit.value) return;
	try {
		await updateDocumentAsync({
			documentId: documentToEdit.value.id,
			updates: data,
		});
		toast.success(t("documents.messages.fileUpdated"));
	} catch {
		toast.error(t("documents.errors.updateFailed"));
	} finally {
		editDialogOpen.value = false;
		documentToEdit.value = null;
	}
}

// Reset any dropped files when the dialog closes, so the next open (from the
// header's upload button, which just flips the shared open state) starts empty.
watch(uploadDialogOpen, (open) => {
	if (!open) droppedFiles.value = [];
});

function handleUploadComplete() {
	toast.success(t("documents.messages.filesUploaded"));
	uploadDialogOpen.value = false;
	isDraggingOver.value = false;
}

function handleDragEnter(e: DragEvent) {
	e.preventDefault();
	if (e.dataTransfer?.types.includes("Files")) {
		isDraggingOver.value = true;
	}
}

function handleDragOver(e: DragEvent) {
	e.preventDefault();
}

function handleDragLeave(e: DragEvent) {
	e.preventDefault();
	const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
	if (
		e.clientX <= rect.left ||
		e.clientX >= rect.right ||
		e.clientY <= rect.top ||
		e.clientY >= rect.bottom
	) {
		isDraggingOver.value = false;
	}
}

// Route dropped files through the upload dialog so a drop is validated and
// reviewed the same as a browse — one unified upload flow.
function ingestDropped(files: File[]) {
	if (files.length === 0) return;
	droppedFiles.value = files;
	uploadDialogOpen.value = true;
}

function handleDrop(e: DragEvent) {
	e.preventDefault();
	isDraggingOver.value = false;

	const files = e.dataTransfer?.files;
	if (files) ingestDropped(Array.from(files));
}

// On desktop, Tauri intercepts OS file drops before the DOM (so the handlers
// above never see them); the bridge delivers the files and the drag-over state
// here instead. On the web neither fires and the DOM path above is used.
const { onFilesDropped, onDragStateChanged } = useFileBridge();
onFilesDropped(ingestDropped);
onDragStateChanged((over) => {
	isDraggingOver.value = over;
});

// Publish the workspace's effective upload cap so the desktop host can skip an
// oversized OS drop by its size before reading it over IPC. No-op on the web.
const { currentWorkspace } = useWorkspaces();
watchEffect(() => {
	setDropSizeLimit(currentWorkspace.value?.settings.maxUploadBytes);
});

function handleLoadMore() {
	if (hasMore.value && !isLoadingMore.value) {
		loadMore();
	}
}
</script>

<template>
  <div
    class="flex flex-col gap-4 p-4 pt-4 pb-6 relative h-[calc(100vh-5.5rem)]"
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
      <!-- Search, filters, view toggle, and upload live in the app header via
           the socket, sharing state with this page via useDocumentsView. -->
      <HeaderSocket>
        <DocumentsHeaderControls />
      </HeaderSocket>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
      >
        <p class="text-sm text-destructive">
          {{ error.message || t("documents.errors.loadFailed") }}
        </p>
      </div>

      <template v-else>
        <!-- Files Content Area -->
        <div v-if="documents.length > 0" class="relative flex-1 min-h-0">
          <!-- Drag overlay -->
          <Transition
            enter-active-class="transition-opacity duration-200"
            leave-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <div
              v-if="isDraggingOver"
              class="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm"
            >
              <div
                class="flex flex-col items-center gap-3 rounded-xl bg-muted/80 px-8 py-6 shadow-sm"
              >
                <div
                  class="flex size-11 items-center justify-center rounded-full bg-background"
                >
                  <Upload :size="22" class="text-muted-foreground" />
                </div>
                <p class="text-sm font-medium text-foreground">
                  {{ t("documents.dialogs.upload.dropHint") }}
                </p>
              </div>
            </div>
          </Transition>

          <!-- List View (Data Table). The VirtualTable fills its parent's
               height on its own (its scroll container is `h-full`), so no class
               is passed here — VirtualTable is multi-root, so an inherited
               `class` would be dropped with a Vue warning anyway. -->
          <DocumentsTableView
            v-if="viewMode === 'list'"
            :documents="documents"
            :selection="documentsSelection"
            @view="viewFile"
            @edit="openEditDialog"
            @download="handleDownloadFile"
            @delete="openDeleteDialog"
            @export="handleExportFile"
            @assign="openAssignDialog"
            @bulk-open="handleBulkOpen"
            @bulk-download="handleBulkDownload"
            @bulk-export="handleBulkExport"
            @bulk-delete="openBulkDeleteDialog"
            @load-more="handleLoadMore"
          />

          <!-- Grid View -->
          <DocumentsGridView
            v-else
            class="h-full"
            :documents="documents"
            :selection="documentsSelection"
            @bulk-open="handleBulkOpen"
            @bulk-download="handleBulkDownload"
            @bulk-export="handleBulkExport"
            @bulk-delete="openBulkDeleteDialog"
            @view="viewFile"
            @edit="openEditDialog"
            @download="handleDownloadFile"
            @delete="openDeleteDialog"
            @export="handleExportFile"
            @assign="openAssignDialog"
            @load-more="handleLoadMore"
          />
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="py-16 text-center flex-1 flex flex-col items-center justify-center"
        >
          <div
            class="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50"
          >
            <FileText class="h-5 w-5 text-muted-foreground" />
          </div>
          <p class="text-sm font-medium text-foreground mb-1">
            {{ t("documents.table.empty.title") }}
          </p>
          <p
            class="text-sm text-muted-foreground max-w-sm"
            :class="hasFilters ? 'mb-4' : ''"
          >
            {{
              hasFilters
                ? t("documents.table.empty.filterDescription")
                : t("documents.table.empty.description")
            }}
          </p>
          <Button
            v-if="hasFilters"
            variant="outline"
            size="sm"
            @click="clearFilters"
          >
            {{ t("documents.actions.clearFilters") }}
          </Button>
        </div>
      </template>
    </div>

    <!-- Dialogs -->
    <DeleteDocumentDialog
      v-model:open="deleteDialogOpen"
      :document-name="documentToDelete?.displayName"
      :document-count="documentToDelete ? 1 : selectedDocumentsCount"
      :is-deleting="isDeleting"
      @confirm="confirmDelete"
    />

    <EditDocumentDialog
      v-model:open="editDialogOpen"
      :document="documentToEdit"
      :is-loading="isUpdating"
      @update="confirmEdit"
    />

    <AssignDocumentDialog v-model:open="assignDialogOpen" :document="documentToAssign" />

    <UploadDocumentsDialog
      v-model:open="uploadDialogOpen"
      :upload-fn="uploadDocumentsAsync"
      :initial-files="droppedFiles"
      @uploaded="handleUploadComplete"
    />

    <ExportToConnectionDialog
      v-model:open="exportDialogOpen"
      :file-ids="filesToExport"
      :unredacted-count="unredactedExportCount"
      :connections="connections ?? []"
      :is-loading="isExporting"
      @export="handleExport"
    />

    <ImportFromConnectionDialog
      v-model:open="importDialogOpen"
      :connections="connections ?? []"
      @import="handleImport"
    />
  </div>
</template>
