<script setup lang="ts">
import { ref } from "vue";
import {
	FileText,
	Split,
	Merge,
	FileOutput,
	Save,
	ChevronDown,
	Highlighter,
	MessageSquare,
	FileInput,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Tool {
	id: string;
	name: string;
	icon: any;
}

interface Props {
	selectedTool?: string;
}

interface Emits {
	(e: "selectTool", toolId: string): void;
	(e: "rotate"): void;
	(e: "saveAsPdf"): void;
	(e: "saveAsDoc"): void;
}

const props = withDefaults(defineProps<Props>(), {
	selectedTool: "highlight",
});

const emit = defineEmits<Emits>();

// Modification tools - modify existing file
const modifyTools: Tool[] = [
	{ id: "highlight", name: "Highlight", icon: Highlighter },
	{ id: "annotate", name: "Annotate", icon: MessageSquare },
];

// Creation tools - create new files
const createTools: Tool[] = [
	{ id: "split", name: "Split", icon: Split },
	{ id: "merge", name: "Merge", icon: Merge },
	{ id: "insert", name: "Insert", icon: FileInput },
	{ id: "extract", name: "Extract", icon: FileOutput },
	{ id: "summarize", name: "Summarize", icon: FileText },
];

function selectTool(toolId: string) {
	emit("selectTool", toolId);
}

function rotate() {
	emit("rotate");
}

function saveAsPdf() {
	emit("saveAsPdf");
}

function saveAsDoc() {
	emit("saveAsDoc");
}
</script>

<template>
  <Card>
    <CardHeader class="p-2 pb-1.5 pl-3 pr-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Edit3 :size="16" />
          <h3 class="font-medium text-sm">Tools</h3>
        </div>
        <div class="flex items-center gap-1">
          <div class="flex items-center">
            <Button
              size="sm"
              @click="saveAsPdf"
              class="h-8 px-3 rounded-r-none"
            >
              <Save :size="16" class="mr-1.5" />
              <span class="text-sm">Save</span>
            </Button>
            <div class="h-8 w-px bg-neutral-200 dark:bg-neutral-700"></div>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button size="sm" class="h-8 px-1.5 rounded-l-none">
                  <ChevronDown :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="saveAsPdf">
                  <FileText :size="16" class="mr-2" />
                  Save as .pdf
                </DropdownMenuItem>
                <DropdownMenuItem @click="saveAsDoc">
                  <FileText :size="16" class="mr-2" />
                  Save as .doc
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent class="p-2 pt-0 space-y-3">
      <!-- Modify Tools -->
      <div>
        <p
          class="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 px-1"
        >
          MODIFY
        </p>
        <div class="grid grid-cols-2 gap-0.5">
          <Button
            v-for="tool in modifyTools"
            :key="tool.id"
            :variant="selectedTool === tool.id ? 'default' : 'ghost'"
            size="sm"
            class="justify-start h-7 px-2"
            @click="selectTool(tool.id)"
          >
            <component :is="tool.icon" :size="14" class="mr-1.5" />
            <span class="text-sm font-light">{{ tool.name }}</span>
          </Button>
        </div>
      </div>

      <!-- Create Tools -->
      <div>
        <p
          class="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 px-1"
        >
          CREATE
        </p>
        <div class="grid grid-cols-2 gap-0.5">
          <Button
            v-for="tool in createTools"
            :key="tool.id"
            :variant="selectedTool === tool.id ? 'default' : 'ghost'"
            size="sm"
            class="justify-start h-7 px-2"
            @click="selectTool(tool.id)"
          >
            <component :is="tool.icon" :size="14" class="mr-1.5" />
            <span class="text-sm font-light">{{ tool.name }}</span>
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
