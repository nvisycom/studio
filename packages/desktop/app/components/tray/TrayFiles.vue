<template>
  <div class="animate-in fade-in duration-200">
    <!-- Search Bar with Auto-Sync Toggle and View Toggle -->
    <div class="flex items-center gap-2 mb-3">
      <div class="relative flex-1">
        <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('files.search')"
          class="w-full h-8 pl-8 pr-3 text-xs bg-muted/50 border-0 rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <ToggleGroup v-model="autoSyncValue" type="single" class="h-8 bg-muted/30 rounded-md p-0.5">
        <ToggleGroupItem value="sync" class="h-7 w-8 p-0 data-[state=off]:bg-muted/50 data-[state=on]:bg-background data-[state=on]:shadow-sm">
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isSyncing }" />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup v-model="viewMode" type="single" class="h-8 bg-muted/30 rounded-md p-0.5">
        <ToggleGroupItem value="list" class="h-7 w-8 p-0 data-[state=off]:bg-muted/50 data-[state=on]:bg-background data-[state=on]:shadow-sm">
          <List class="w-3.5 h-3.5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="folder" class="h-7 w-8 p-0 data-[state=off]:bg-muted/50 data-[state=on]:bg-background data-[state=on]:shadow-sm">
          <FolderTree class="w-3.5 h-3.5" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    <Accordion type="multiple" :default-value="['local', 'remote']" class="w-full">
      <!-- Local Files Section -->
      <AccordionItem value="local" class="border-b-0">
        <AccordionTrigger class="py-2 hover:no-underline [&>svg]:order-first [&>svg]:mr-2">
          <span class="text-sm font-light">{{ $t('files.local') }}</span>
        </AccordionTrigger>
        <AccordionContent>
          <!-- Empty State -->
          <div v-if="filteredLocalFiles.length === 0" class="flex flex-col items-center justify-center py-6 text-center">
            <FileX class="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p class="text-xs text-muted-foreground">{{ $t('files.empty.local') }}</p>
          </div>

          <div v-else class="space-y-1.5 pt-1 pb-3">
            <ContextMenu v-for="file in filteredLocalFiles" :key="file.id">
              <ContextMenuTrigger as-child>
                <div
                  class="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors bg-muted/30"
                  @click="uploadFile"
                >
                  <component :is="getFileIcon(file.name)" class="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm truncate">{{ file.name }}</p>
                  </div>
                  <!-- Progress indicator -->
                  <div v-if="file.uploading" class="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div class="h-full bg-primary transition-all" :style="{ width: file.progress + '%' }"></div>
                  </div>
                  <span v-else class="text-xs text-muted-foreground flex-shrink-0">{{ file.size }}</span>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent class="w-40">
                <ContextMenuItem @click="openFile(file)">
                  <ExternalLink class="w-3.5 h-3.5 mr-2" />
                  {{ $t('files.context.open') }}
                </ContextMenuItem>
                <ContextMenuItem @click="uploadFile">
                  <Upload class="w-3.5 h-3.5 mr-2" />
                  {{ $t('files.context.upload') }}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem @click="deleteFile(file)" class="text-destructive focus:text-destructive">
                  <Trash2 class="w-3.5 h-3.5 mr-2" />
                  {{ $t('files.context.delete') }}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </AccordionContent>
      </AccordionItem>

      <!-- Remote Files Section -->
      <AccordionItem value="remote" class="border-b-0">
        <AccordionTrigger class="py-2 hover:no-underline [&>svg]:order-first [&>svg]:mr-2">
          <span class="text-sm font-light">{{ $t('files.remote') }}</span>
        </AccordionTrigger>
        <AccordionContent>
          <!-- Empty State -->
          <div v-if="filteredRemoteFiles.length === 0" class="flex flex-col items-center justify-center py-6 text-center">
            <CloudOff class="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p class="text-xs text-muted-foreground">{{ $t('files.empty.remote') }}</p>
          </div>

          <div v-else class="space-y-1.5 pt-1 pb-3">
            <ContextMenu v-for="file in filteredRemoteFiles" :key="file.id">
              <ContextMenuTrigger as-child>
                <div
                  class="flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors bg-muted/30 group"
                  @click="downloadFile(file)"
                >
                  <component :is="getFileIcon(file.name)" class="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm truncate">{{ file.name }}</p>
                  </div>
                  <!-- Progress indicator -->
                  <div v-if="file.downloading" class="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div class="h-full bg-primary transition-all" :style="{ width: file.progress + '%' }"></div>
                  </div>
                  <span v-else class="text-xs text-muted-foreground flex-shrink-0">{{ file.size }}</span>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent class="w-40">
                <ContextMenuItem @click="downloadFile(file)">
                  <Download class="w-3.5 h-3.5 mr-2" />
                  {{ $t('files.context.download') }}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem @click="deleteFile(file)" class="text-destructive focus:text-destructive">
                  <Trash2 class="w-3.5 h-3.5 mr-2" />
                  {{ $t('files.context.delete') }}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>

<script setup lang="ts">
import {
	CloudOff,
	Download,
	ExternalLink,
	File,
	FileArchive,
	FileAudio,
	FileCode,
	FileImage,
	FileSpreadsheet,
	FileText,
	FileType,
	FileVideo,
	FileX,
	FolderTree,
	List,
	RefreshCw,
	Search,
	Trash2,
	Upload,
} from "lucide-vue-next";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { useDragDrop } from "~/composables/useDragDrop";

// Drag and drop
const { droppedPaths, clearDroppedPaths } = useDragDrop();

// Search
const searchQuery = ref("");

// View mode (list or folder)
const viewMode = ref("list");

// Auto-sync toggle (uses "sync" value when enabled, empty when disabled)
const autoSyncValue = ref("");
const autoSync = computed(() => autoSyncValue.value === "sync");

// Syncing state (true when actively syncing)
const isSyncing = ref(false);

// Helper to get filename from path
const getFileName = (path: string): string => {
	return path.split("/").pop() || path;
};

// Next file ID counter
const nextFileId = ref(100);

// Mock local files data
const localFiles = ref([
	{
		id: 1,
		name: "project-proposal.pdf",
		size: "2.4 MB",
		uploading: false,
		progress: 0,
	},
	{
		id: 2,
		name: "app-screenshot.png",
		size: "1.1 MB",
		uploading: true,
		progress: 65,
	},
	{ id: 3, name: "README.md", size: "4.2 KB", uploading: false, progress: 0 },
	{ id: 4, name: "data.xlsx", size: "856 KB", uploading: false, progress: 0 },
]);

// Watch for dropped file paths and add them to local files
watch(droppedPaths, (paths) => {
	if (paths.length > 0) {
		for (const path of paths) {
			const newFile = {
				id: nextFileId.value++,
				name: getFileName(path),
				size: "...",
				uploading: true,
				progress: 0,
			};
			localFiles.value.unshift(newFile);

			// Simulate upload progress
			const fileId = newFile.id;
			const interval = setInterval(() => {
				const fileToUpdate = localFiles.value.find((f) => f.id === fileId);
				if (fileToUpdate) {
					fileToUpdate.progress += Math.random() * 15 + 5;
					if (fileToUpdate.progress >= 100) {
						fileToUpdate.progress = 100;
						fileToUpdate.uploading = false;
						fileToUpdate.size = "1.2 MB"; // Mock size after upload
						clearInterval(interval);
					}
				} else {
					clearInterval(interval);
				}
			}, 200);
		}
		clearDroppedPaths();
	}
});

// Mock remote files data
const remoteFiles = ref([
	{
		id: 1,
		name: "backup-2024-01.zip",
		size: "15.8 MB",
		downloading: false,
		progress: 0,
	},
	{
		id: 2,
		name: "config.json",
		size: "856 B",
		downloading: false,
		progress: 0,
	},
	{
		id: 3,
		name: "assets.tar.gz",
		size: "8.2 MB",
		downloading: true,
		progress: 30,
	},
]);

// Filtered files based on search
const filteredLocalFiles = computed(() => {
	if (!searchQuery.value) return localFiles.value;
	return localFiles.value.filter((f) =>
		f.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
	);
});

const filteredRemoteFiles = computed(() => {
	if (!searchQuery.value) return remoteFiles.value;
	return remoteFiles.value.filter((f) =>
		f.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
	);
});

// Helper function to get file icon based on extension
const getFileIcon = (filename: string) => {
	const ext = filename.split(".").pop()?.toLowerCase() || "";

	if (
		["png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp"].includes(ext)
	) {
		return FileImage;
	}
	if (
		[
			"js",
			"ts",
			"jsx",
			"tsx",
			"vue",
			"py",
			"rb",
			"go",
			"rs",
			"java",
			"c",
			"cpp",
			"h",
			"css",
			"scss",
			"html",
			"xml",
			"sh",
			"bash",
		].includes(ext)
	) {
		return FileCode;
	}
	if (["zip", "tar", "gz", "rar", "7z", "bz2", "xz"].includes(ext)) {
		return FileArchive;
	}
	if (["xlsx", "xls", "csv", "ods"].includes(ext)) {
		return FileSpreadsheet;
	}
	if (["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"].includes(ext)) {
		return FileVideo;
	}
	if (["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext)) {
		return FileAudio;
	}
	if (["pdf", "doc", "docx", "odt", "rtf"].includes(ext)) {
		return FileText;
	}
	if (
		["txt", "md", "json", "yaml", "yml", "toml", "ini", "conf", "cfg"].includes(
			ext,
		)
	) {
		return FileType;
	}
	return File;
};

// File actions
const uploadFile = () => {
	console.log("Upload file...");
};

const downloadFile = (file: { id: number; name: string }) => {
	console.log("Download file:", file.name);
};

const downloadAll = () => {
	console.log("Download all remote files...");
};

const openFile = (file: { id: number; name: string }) => {
	console.log("Open file:", file.name);
};

const deleteFile = (file: { id: number; name: string }) => {
	console.log("Delete file:", file.name);
};
</script>
