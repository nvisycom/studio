<script setup lang="ts">
import { Trash2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface Props {
	open: boolean;
	fileName?: string;
	fileCount?: number;
	isDeleting?: boolean;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "confirm"): void;
}

const props = withDefaults(defineProps<Props>(), {
	fileCount: 1,
	isDeleting: false,
});
const emit = defineEmits<Emits>();

const { t } = useI18n();

const isMultiple = computed(() => props.fileCount > 1);
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
          >
            <Trash2 class="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <DialogTitle class="text-left">
              {{
                isMultiple
                  ? t("files.dialogs.delete.titleMultiple")
                  : t("files.dialogs.delete.title")
              }}
            </DialogTitle>
          </div>
        </div>
      </DialogHeader>

      <div class="py-4">
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          {{
            isMultiple
              ? t("files.dialogs.delete.descriptionMultiple", {
                  count: fileCount,
                })
              : t("files.dialogs.delete.description")
          }}
        </p>
        <p
          v-if="fileName && !isMultiple"
          class="mt-2 font-medium text-neutral-900 dark:text-white"
        >
          {{ fileName }}
        </p>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          @click="emit('update:open', false)"
          :disabled="isDeleting"
          class="font-light"
        >
          {{ t("files.dialogs.delete.cancel") }}
        </Button>
        <Button
          variant="destructive"
          @click="emit('confirm')"
          :disabled="isDeleting"
          class="font-light"
        >
          {{ t("files.dialogs.delete.confirm") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
