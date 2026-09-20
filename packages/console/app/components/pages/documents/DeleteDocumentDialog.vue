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
	documentName?: string;
	documentCount?: number;
	isDeleting?: boolean;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "confirm"): void;
}

const props = withDefaults(defineProps<Props>(), {
	documentCount: 1,
	isDeleting: false,
});
const emit = defineEmits<Emits>();

const { t } = useI18n();

const isMultiple = computed(() => props.documentCount > 1);
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{
            isMultiple
              ? t("documents.dialogs.delete.titleMultiple")
              : t("documents.dialogs.delete.title")
          }}
        </DialogTitle>
        <DialogDescription>
          {{
            isMultiple
              ? t("documents.dialogs.delete.descriptionMultiple", { count: documentCount })
              : t("documents.dialogs.delete.description")
          }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="documentName && !isMultiple" class="min-w-0">
        <p class="truncate text-sm font-medium text-foreground" :title="documentName">
          {{ documentName }}
        </p>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          @click="emit('update:open', false)"
          :disabled="isDeleting"
        >
          {{ t("documents.dialogs.delete.cancel") }}
        </Button>
        <Button
          variant="destructive"
          @click="emit('confirm')"
          :disabled="isDeleting"
        >
          <Loader2 v-if="isDeleting" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("documents.dialogs.delete.confirm") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
