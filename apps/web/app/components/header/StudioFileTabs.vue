<script setup lang="ts">
import { FileText, X, Loader2, ChevronDown } from "@lucide/vue";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#console/components/ui/tooltip";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import { Button } from "#console/components/ui/button";

const router = useRouter();

// Use studio files store for multiple open files
const { openFiles, activeFileId, closeFile, setActiveFile, moveFileToFront } =
	useStudioFiles();

// Max visible tabs before showing dropdown
const MAX_VISIBLE_TABS = 3;

// Compute visible tabs and overflow tabs
const visibleFiles = computed(() => {
	if (openFiles.value.length <= MAX_VISIBLE_TABS) {
		return openFiles.value;
	}

	// Always show the active file in visible tabs
	const activeIndex = openFiles.value.findIndex(
		(f) => f.fileId === activeFileId.value,
	);

	if (activeIndex < MAX_VISIBLE_TABS) {
		// Active file is already in the visible range
		return openFiles.value.slice(0, MAX_VISIBLE_TABS);
	}

	// Active file is in overflow, swap it with the last visible tab
	const visible = openFiles.value.slice(0, MAX_VISIBLE_TABS - 1);
	const activeFile = openFiles.value[activeIndex];
	if (activeFile) {
		return [...visible, activeFile];
	}
	return visible;
});

const overflowFiles = computed(() => {
	if (openFiles.value.length <= MAX_VISIBLE_TABS) {
		return [];
	}

	const visibleIds = new Set(
		visibleFiles.value.map((f) => f?.fileId).filter(Boolean),
	);
	return openFiles.value.filter((f) => f && !visibleIds.has(f.fileId));
});

const hasOverflow = computed(() => overflowFiles.value.length > 0);

function handleCloseFile(fileId: string) {
	closeFile(fileId);
	// If no more files open, navigate back to files page
	if (openFiles.value.length === 0) {
		router.push("/files");
	}
}

function handleSelectFile(fileId: string) {
	setActiveFile(fileId);
}

function handleSelectFromDropdown(fileId: string) {
	moveFileToFront(fileId);
}

function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str;
	return `${str.slice(0, maxLength - 3)}...`;
}
</script>

<template>
  <div
    v-if="openFiles.length > 0"
    class="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground gap-1"
  >
    <TooltipProvider>
      <!-- Visible Tabs -->
      <Tooltip v-for="file in visibleFiles" :key="file.fileId">
        <TooltipTrigger as-child>
          <div
            :class="[
              'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-normal ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer gap-2 group min-w-[100px] max-w-[180px]',
              activeFileId === file.fileId
                ? 'bg-background text-foreground shadow'
                : 'hover:bg-background/50 text-muted-foreground',
            ]"
            @click="handleSelectFile(file.fileId)"
          >
            <div class="relative flex-shrink-0">
              <Loader2 v-if="file.isLoading" :size="14" class="animate-spin" />
              <FileText v-else :size="14" />
            </div>
            <span class="text-sm truncate flex-1">
              {{ truncate(file.displayName, 20) }}
            </span>
            <Button
              variant="ghost"
              size="icon"
              class="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
              @click.stop="handleCloseFile(file.fileId)"
            >
              <X :size="12" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{{ file.displayName }}</p>
        </TooltipContent>
      </Tooltip>

      <!-- Overflow Dropdown -->
      <DropdownMenu v-if="hasOverflow">
        <DropdownMenuTrigger as-child>
          <div
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 py-1 text-sm font-normal ring-offset-background transition-all cursor-pointer gap-1 hover:bg-background/50 text-muted-foreground"
          >
            <span class="text-xs">+{{ overflowFiles.length }}</span>
            <ChevronDown :size="14" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          class="w-[220px] max-h-[300px] overflow-y-auto"
        >
          <DropdownMenuItem
            v-for="file in overflowFiles"
            :key="file.fileId"
            class="cursor-pointer flex items-center gap-2 group"
            @click="handleSelectFromDropdown(file.fileId)"
          >
            <div class="relative flex-shrink-0">
              <Loader2 v-if="file.isLoading" :size="14" class="animate-spin" />
              <FileText v-else :size="14" />
            </div>
            <span class="flex-1 truncate">{{ file.displayName }}</span>
            <Button
              variant="ghost"
              size="icon"
              class="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
              @click.stop="handleCloseFile(file.fileId)"
            >
              <X :size="12" />
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  </div>

  <!-- Empty state when no file is open -->
  <div
    v-else
    class="inline-flex h-9 items-center justify-center rounded-lg bg-muted px-3 text-muted-foreground text-sm font-normal"
  >
    No file selected
  </div>
</template>
