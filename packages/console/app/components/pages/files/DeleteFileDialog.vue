<script setup lang="ts">
import { Loader2 } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";

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
        <DialogTitle>
          {{
            isMultiple
              ? t("files.dialogs.delete.titleMultiple")
              : t("files.dialogs.delete.title")
          }}
        </DialogTitle>
        <DialogDescription>
          {{
            isMultiple
              ? t("files.dialogs.delete.descriptionMultiple", { count: fileCount })
              : t("files.dialogs.delete.description")
          }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="fileName && !isMultiple" class="min-w-0">
        <p class="truncate text-sm font-medium text-foreground" :title="fileName">
          {{ fileName }}
        </p>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          @click="emit('update:open', false)"
          :disabled="isDeleting"
        >
          {{ t("files.dialogs.delete.cancel") }}
        </Button>
        <Button
          variant="destructive"
          @click="emit('confirm')"
          :disabled="isDeleting"
        >
          <Loader2 v-if="isDeleting" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("files.dialogs.delete.confirm") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
