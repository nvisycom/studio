<script setup lang="ts">
import { Search } from "@lucide/vue";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import {
	EditDocumentDialog,
	StatsCards,
	CorpusTable,
} from "#console/components/pages/files";
import { ConfirmDialog } from "#console/components/common";
import type { CorpusDocument } from "#console/components/pages/files/CorpusTable.vue";

useHead({ title: "Corpus" });

definePageMeta({
	pageCategory: "header.category.files",
});

const { wLink } = useWorkspaceLink();
const { t } = useI18n();

const searchQuery = ref("");
const statusFilter = ref("all");

const corpusDocuments = ref<CorpusDocument[]>([
	{
		id: "1",
		name: "product-documentation.pdf",
		fileSize: "2.4 MB",
		indexSize: "128 KB",
		segments: 384,
		avgQuery: "245ms",
		indexedBy: "John Doe",
		indexedAt: new Date("2024-01-15T14:30:00"),
		visualSupport: false,
		contentSegmentation: "semantic",
		status: "indexed",
	},
	{
		id: "2",
		name: "faq-database.txt",
		fileSize: "156 KB",
		indexSize: "12 KB",
		segments: 24,
		avgQuery: "89ms",
		indexedBy: "Jane Smith",
		indexedAt: new Date("2024-01-20T09:15:00"),
		visualSupport: false,
		contentSegmentation: "paragraph",
		status: "processing",
	},
	{
		id: "3",
		name: "training-materials.docx",
		fileSize: "5.1 MB",
		indexSize: "256 KB",
		segments: 812,
		avgQuery: "312ms",
		indexedBy: "Bob Johnson",
		indexedAt: new Date("2024-01-22T16:45:00"),
		visualSupport: false,
		contentSegmentation: "fixed",
		status: "failed",
	},
]);

// Stats
const totalDocumentsSize = ref("251 MB");
const indexSize = ref("14.2 MB");
const totalSize = ref("265.2 MB");
const totalSegments = ref(2031);
const totalDocuments = ref(3);
const avgSegmentSize = ref("6.5 KB");
const avgResponseTime = ref(124);
const cacheHitRate = ref(78);
const p95ResponseTime = ref(247);

const documentCount = computed(() => corpusDocuments.value.length);

const filteredDocuments = computed(() => {
	return corpusDocuments.value.filter((doc) => {
		const matchesStatus =
			statusFilter.value === "all" || doc.status === statusFilter.value;
		const matchesSearch =
			searchQuery.value === "" ||
			doc.name.toLowerCase().includes(searchQuery.value.toLowerCase());
		return matchesStatus && matchesSearch;
	});
});

const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const selectedDocument = ref<CorpusDocument | null>(null);

function addDocument() {
	// TODO: Implement add document to corpus
}

function editDocument(docId: string) {
	const doc = corpusDocuments.value.find((d) => d.id === docId);
	if (doc) {
		selectedDocument.value = doc;
		isEditDialogOpen.value = true;
	}
}

function saveEdit(data: {
	visualSupport: boolean;
	contentSegmentation: string;
}) {
	if (selectedDocument.value) {
		selectedDocument.value.visualSupport = data.visualSupport;
		selectedDocument.value.contentSegmentation = data.contentSegmentation;
	}
}

function deleteDocument(docId: string) {
	const doc = corpusDocuments.value.find((d) => d.id === docId);
	if (doc) {
		selectedDocument.value = doc;
		isDeleteDialogOpen.value = true;
	}
}

function confirmDelete() {
	if (selectedDocument.value) {
		corpusDocuments.value = corpusDocuments.value.filter(
			(d) => d.id !== selectedDocument.value!.id,
		);
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-6xl mx-auto w-full space-y-4">
      <!-- Stats Cards -->
      <StatsCards
        :total-size="totalSize"
        :total-documents-size="totalDocumentsSize"
        :index-size="indexSize"
        :total-documents="totalDocuments"
        :total-segments="totalSegments"
        :avg-segment-size="avgSegmentSize"
        :avg-response-time="avgResponseTime"
        :p95-response-time="p95ResponseTime"
        :cache-hit-rate="cacheHitRate"
      />

      <!-- Main Card -->
      <Card class="overflow-hidden py-0 pt-6 rounded-xl border-border/50">
        <CardHeader>
          <div class="flex items-center justify-between mb-4">
            <div>
              <CardTitle class="text-sm font-medium">
                {{ t("files.corpus.title") }}
              </CardTitle>
              <CardDescription class="text-xs text-muted-foreground">
                {{ t("files.corpus.documentCount", documentCount) }}
              </CardDescription>
            </div>
            <NuxtLink :to="wLink('/files')">
              <Button size="sm" variant="outline">
                {{ t("files.corpus.viewDocuments") }}
              </Button>
            </NuxtLink>
          </div>

          <!-- Search and Filters -->
          <div class="flex gap-2">
            <div class="relative flex-1">
              <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              />
              <Input
                v-model="searchQuery"
                :placeholder="t('files.corpus.searchPlaceholder')"
                class="pl-9 h-9"
              />
            </div>
            <Select v-model="statusFilter">
              <SelectTrigger class="w-[180px] h-9">
                <SelectValue :placeholder="t('files.corpus.status.all')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {{ t("files.corpus.status.all") }}
                </SelectItem>
                <SelectItem value="indexed">
                  {{ t("files.corpus.status.indexed") }}
                </SelectItem>
                <SelectItem value="processing">
                  {{ t("files.corpus.status.processing") }}
                </SelectItem>
                <SelectItem value="failed">
                  {{ t("files.corpus.status.failed") }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <CorpusTable
            :documents="filteredDocuments"
            @edit="editDocument"
            @delete="deleteDocument"
          />
        </CardContent>
        <CardFooter
          class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl"
        >
          <p class="text-xs text-muted-foreground">
            {{ t("files.corpus.footer") }}
          </p>
        </CardFooter>
      </Card>
    </div>

    <!-- Edit Dialog -->
    <EditDocumentDialog
      v-model:open="isEditDialogOpen"
      :visual-support="selectedDocument?.visualSupport ?? false"
      :content-segmentation="
        selectedDocument?.contentSegmentation ?? 'semantic'
      "
      @save="saveEdit"
    />

    <!-- Delete Dialog -->
    <ConfirmDialog
      v-model:open="isDeleteDialogOpen"
      :title="t('files.corpus.delete.title')"
      :description="
        t('files.corpus.delete.description', {
          name: selectedDocument?.name ?? '',
        })
      "
      :confirm-label="t('files.corpus.delete.confirm')"
      :cancel-label="t('files.corpus.delete.cancel')"
      @confirm="confirmDelete"
    />
  </div>
</template>
