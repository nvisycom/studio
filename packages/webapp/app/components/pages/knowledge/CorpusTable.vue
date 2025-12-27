<script setup lang="ts">
import {
	MoreVertical,
	Pencil,
	Trash2,
	CheckCircle2,
	Clock,
	XCircle,
	FileText,
} from "lucide-vue-next";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { EntityAvatar } from "@/components/common";

export interface CorpusDocument {
	id: string;
	name: string;
	fileSize: string;
	indexSize: string;
	segments: number;
	avgQuery: string;
	indexedBy: string;
	indexedAt: Date;
	visualSupport: boolean;
	contentSegmentation: string;
	status: "indexed" | "processing" | "failed";
}

interface Props {
	documents: CorpusDocument[];
}

interface Emits {
	(e: "edit", docId: string): void;
	(e: "delete", docId: string): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

function getStatusIcon(status: string) {
	switch (status) {
		case "indexed":
			return CheckCircle2;
		case "processing":
			return Clock;
		case "failed":
			return XCircle;
		default:
			return FileText;
	}
}

function getStatusColor(status: string) {
	switch (status) {
		case "indexed":
			return "text-neutral-600 dark:text-neutral-400";
		case "processing":
			return "text-neutral-600 dark:text-neutral-400";
		case "failed":
			return "text-neutral-600 dark:text-neutral-400";
		default:
			return "text-neutral-400";
	}
}
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Original Name</TableHead>
        <TableHead class="w-[180px]">Indexed</TableHead>
        <TableHead class="w-[120px]">File Size</TableHead>
        <TableHead class="w-[120px]">Index Size</TableHead>
        <TableHead class="w-[100px]">Segments</TableHead>
        <TableHead class="w-[120px]">Avg Query</TableHead>
        <TableHead class="w-[60px]"></TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow
        v-for="doc in documents"
        :key="doc.id"
        class="hover:bg-neutral-50 dark:hover:bg-neutral-900"
      >
        <TableCell>
          <div class="flex items-center gap-2">
            <component
              :is="getStatusIcon(doc.status)"
              :size="16"
              :class="getStatusColor(doc.status)"
            />
            <p class="font-medium text-neutral-900 dark:text-white">
              {{ doc.name }}
            </p>
          </div>
        </TableCell>
        <TableCell>
          <div class="inline-flex items-center gap-2">
            <EntityAvatar :name="doc.indexedBy" size="sm" />
            <div class="flex flex-col">
              <span class="text-sm font-medium">{{ doc.indexedBy }}</span>
              <span class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ doc.indexedAt.toLocaleString() }}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <span class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ doc.fileSize }}
          </span>
        </TableCell>
        <TableCell>
          <span class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ doc.indexSize }}
          </span>
        </TableCell>
        <TableCell>
          <span class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ doc.segments.toLocaleString() }}
          </span>
        </TableCell>
        <TableCell>
          <span class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ doc.avgQuery }}
          </span>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon" class="h-8 w-8">
                <MoreVertical :size="16" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="emit('edit', doc.id)">
                <Pencil :size="16" class="mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                @click="emit('delete', doc.id)"
                class="text-red-600 dark:text-red-400"
              >
                <Trash2 :size="16" class="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
