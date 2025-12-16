<script setup lang="ts">
import { ref } from "vue";
import {
  FileText,
  Upload,
  Download,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Square,
  Highlighter,
  Type,
  Eraser,
  Undo,
  Redo,
  Save,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

definePageMeta({
  pageName: "Documents",
});

const selectedTool = ref<string>("select");
const zoomLevel = ref(100);
const currentPage = ref(1);
const totalPages = ref(5);

const tools = [
  { id: "select", name: "Select", icon: Square },
  { id: "redact", name: "Redact", icon: Highlighter },
  { id: "text", name: "Text", icon: Type },
  { id: "erase", name: "Erase", icon: Eraser },
];

function selectTool(toolId: string) {
  selectedTool.value = toolId;
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

function rotate() {
  console.log("Rotating document");
}

function undo() {
  console.log("Undo");
}

function redo() {
  console.log("Redo");
}

function save() {
  console.log("Saving document");
}

function exportDocument() {
  console.log("Exporting document");
}

function uploadDocument() {
  console.log("Uploading new document");
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col h-full">
    <!-- Top Toolbar -->
    <div
      class="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-3"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <FileText
              :size="20"
              class="text-neutral-600 dark:text-neutral-400"
            />
            <span class="font-semibold">document_sample.pdf</span>
            <Badge variant="secondary" class="text-xs">Draft</Badge>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" @click="uploadDocument">
            <Upload :size="16" class="mr-2" />
            Upload
          </Button>
          <Button variant="outline" size="sm" @click="exportDocument">
            <Download :size="16" class="mr-2" />
            Export
          </Button>
          <Button size="sm" @click="save">
            <Save :size="16" class="mr-2" />
            Save
          </Button>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar - Tools -->
      <div
        class="w-16 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex flex-col items-center py-4 gap-2"
      >
        <Button
          v-for="tool in tools"
          :key="tool.id"
          :variant="selectedTool === tool.id ? 'default' : 'ghost'"
          size="sm"
          class="w-12 h-12 p-0"
          @click="selectTool(tool.id)"
          :title="tool.name"
        >
          <component :is="tool.icon" :size="20" />
        </Button>

        <div class="flex-1" />

        <Button variant="ghost" size="sm" class="w-12 h-12 p-0" @click="undo">
          <Undo :size="20" />
        </Button>
        <Button variant="ghost" size="sm" class="w-12 h-12 p-0" @click="redo">
          <Redo :size="20" />
        </Button>
      </div>

      <!-- Center - Canvas Area -->
      <div class="flex-1 flex flex-col bg-neutral-100 dark:bg-neutral-950">
        <!-- Zoom Controls -->
        <div
          class="flex items-center justify-center gap-2 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
        >
          <Button variant="outline" size="sm" @click="zoomOut">
            <ZoomOut :size="16" />
          </Button>
          <span class="text-sm font-medium min-w-[60px] text-center">
            {{ zoomLevel }}%
          </span>
          <Button variant="outline" size="sm" @click="zoomIn">
            <ZoomIn :size="16" />
          </Button>
          <div
            class="border-l border-neutral-200 dark:border-neutral-800 h-6 mx-2"
          />
          <Button variant="outline" size="sm" @click="rotate">
            <RotateCw :size="16" />
          </Button>
        </div>

        <!-- Document Canvas -->
        <div class="flex-1 flex items-center justify-center p-8 overflow-auto">
          <Card
            class="shadow-lg"
            :style="{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center',
            }"
          >
            <CardContent class="p-0">
              <div
                class="w-[600px] h-[800px] bg-white flex items-center justify-center text-neutral-400"
              >
                <div class="text-center">
                  <FileText :size="64" class="mx-auto mb-4 opacity-20" />
                  <p class="text-sm">Document Preview Area</p>
                  <p class="text-xs mt-2">
                    Page {{ currentPage }} of {{ totalPages }}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Page Navigation -->
        <div
          class="flex items-center justify-center gap-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
        >
          <Button
            variant="outline"
            size="sm"
            @click="previousPage"
            :disabled="currentPage === 1"
          >
            Previous
          </Button>
          <span class="text-sm font-medium">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <Button
            variant="outline"
            size="sm"
            @click="nextPage"
            :disabled="currentPage === totalPages"
          >
            Next
          </Button>
        </div>
      </div>

      <!-- Right Sidebar - Layers/Properties -->
      <div
        class="w-64 border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4"
      >
        <div class="flex items-center gap-2 mb-4">
          <Layers :size="18" />
          <h3 class="font-semibold">Layers</h3>
        </div>

        <div class="space-y-2">
          <Card
            class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <CardContent class="p-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Square :size="14" />
                  <span class="text-sm">Redaction 1</span>
                </div>
                <Badge variant="secondary" class="text-xs">Page 1</Badge>
              </div>
            </CardContent>
          </Card>

          <Card
            class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <CardContent class="p-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Type :size="14" />
                  <span class="text-sm">Text Annotation</span>
                </div>
                <Badge variant="secondary" class="text-xs">Page 2</Badge>
              </div>
            </CardContent>
          </Card>

          <Card
            class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <CardContent class="p-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Highlighter :size="14" />
                  <span class="text-sm">Highlight</span>
                </div>
                <Badge variant="secondary" class="text-xs">Page 3</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure the page takes full height */
</style>
