<script setup lang="ts">
import { ref } from "vue";
import {
	FileText,
	ZoomIn,
	ZoomOut,
	X,
	Split,
	Merge,
	Edit3,
	FileOutput,
	Loader2,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tools, Layers, ZoomControls } from "~/components/pages/documents";

definePageMeta({
	pageName: "Documents",
});

const selectedTool = ref<string>("highlight");
const zoomLevel = ref(100);

interface OpenFile {
	id: string;
	name: string;
	status: "unsaved" | "loading" | "saved";
}

const openFiles = ref<OpenFile[]>([
	{ id: "1", name: "contract_final.pdf", status: "unsaved" },
	{ id: "2", name: "invoice_2024_q1_financial_report.pdf", status: "loading" },
	{ id: "3", name: "report.pdf", status: "saved" },
]);

const activeFileId = ref("1");

const layers = ref([
	{ id: "1", name: "Split Operation", icon: Split, page: 1 },
	{ id: "2", name: "Edit Annotation", icon: Edit3, page: 2 },
	{ id: "3", name: "Extract Data", icon: FileOutput, page: 3 },
	{ id: "4", name: "Merge Pages", icon: Merge, page: 4 },
]);

function selectTool(toolId: string) {
	selectedTool.value = toolId;
	console.log("Selected tool:", toolId);
}

function rotate() {
	console.log("Rotating document");
}

function saveAsPdf() {
	console.log("Saving as PDF");
}

function saveAsDoc() {
	console.log("Saving as DOC");
}

function deleteLayer(layerId: string) {
	const index = layers.value.findIndex((l) => l.id === layerId);
	if (index !== -1) {
		layers.value.splice(index, 1);
	}
}

function selectLayer(layerId: string) {
	console.log("Selected layer:", layerId);
}

function zoomIn() {
	if (zoomLevel.value < 200) {
		zoomLevel.value += 10;
	}
}

function zoomOut() {
	if (zoomLevel.value > 50) {
		zoomLevel.value -= 10;
	}
}

function undo() {
	console.log("Undo");
}

function redo() {
	console.log("Redo");
}

function selectFile(fileId: string) {
	activeFileId.value = fileId;
}

function closeFile(fileId: string) {
	const index = openFiles.value.findIndex((f) => f.id === fileId);
	if (index !== -1) {
		openFiles.value.splice(index, 1);
		if (activeFileId.value === fileId && openFiles.value.length > 0) {
			activeFileId.value = openFiles.value[0].id;
		}
	}
}

function getStatusColor(status: string) {
	switch (status) {
		case "unsaved":
			return "bg-neutral-400";
		case "loading":
			return "";
		case "saved":
			return "hidden";
		default:
			return "bg-neutral-400";
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col h-full bg-neutral-100 dark:bg-neutral-950">
    <!-- Main Content Area -->
    <div class="flex flex-1">
      <!-- Center - Canvas Area -->
      <div
        class="flex-1 flex flex-col bg-neutral-100 dark:bg-neutral-950 overflow-y-auto relative"
      >
        <!-- Document Canvas with Scrollable Pages -->
        <div class="flex flex-col items-center gap-6 p-8 pb-20">
          <Card
            v-for="page in 5"
            :key="page"
            class="shadow-lg flex-shrink-0"
            :style="{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              marginBottom: `${(zoomLevel - 100) * 8}px`,
            }"
          >
            <CardContent class="p-0">
              <div
                class="w-[600px] h-[800px] bg-white flex items-center justify-center text-neutral-400"
              >
                <div class="text-center">
                  <FileText :size="64" class="mx-auto mb-4 opacity-20" />
                  <p class="text-sm">Document Preview Area</p>
                  <p class="text-xs mt-2">Page {{ page }} of 5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Zoom Controls - Fixed Bottom Center -->
        <ZoomControls
          :zoom-level="zoomLevel"
          @zoom-in="zoomIn"
          @zoom-out="zoomOut"
        />
      </div>

      <!-- Right Sidebar - Tools and Layers -->
      <div
        class="w-80 bg-neutral-100 dark:bg-neutral-950 sticky top-16 right-0 self-start overflow-y-auto px-3 py-2 space-y-2 z-10"
      >
        <!-- Tools Widget -->
        <Tools
          :selected-tool="selectedTool"
          @select-tool="selectTool"
          @rotate="rotate"
          @save-as-pdf="saveAsPdf"
          @save-as-doc="saveAsDoc"
        />

        <!-- Layers Widget -->
        <Layers
          :layers="layers"
          @undo="undo"
          @redo="redo"
          @delete-layer="deleteLayer"
          @select-layer="selectLayer"
        />
      </div>
    </div>
  </div>
</template>
