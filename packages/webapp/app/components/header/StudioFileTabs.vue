<script setup lang="ts">
import { ref } from "vue";
import { FileText, X, Loader2 } from "lucide-vue-next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

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
  <div
    class="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
  >
    <TooltipProvider>
      <Tooltip v-for="file in openFiles" :key="file.id">
        <TooltipTrigger as-child>
          <div
            @click="selectFile(file.id)"
            :class="[
              'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer gap-2 group min-w-[140px] max-w-[200px]',
              activeFileId === file.id
                ? 'bg-background text-foreground shadow'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            ]"
          >
            <div class="relative flex-shrink-0">
              <FileText :size="14" />
              <div
                v-if="file.status === 'loading'"
                class="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"
                :title="file.status"
              ></div>
              <div
                v-else-if="file.status === 'unsaved'"
                class="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-neutral-400"
                :title="file.status"
              ></div>
            </div>
            <span class="text-sm truncate flex-1">{{ file.name }}</span>
            <Button
              variant="ghost"
              size="icon"
              class="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
              @click.stop="closeFile(file.id)"
            >
              <X :size="12" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{{ file.name }}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>
