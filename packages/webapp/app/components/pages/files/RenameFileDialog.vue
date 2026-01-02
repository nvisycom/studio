<script setup lang="ts">
import { ref, watch } from "vue";
import { Pencil } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
	fileName: string;
	isRenaming?: boolean;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "confirm", newName: string): void;
}

const props = withDefaults(defineProps<Props>(), {
	isRenaming: false,
});
const emit = defineEmits<Emits>();

const { t } = useI18n();

const newFileName = ref("");

watch(
	() => props.open,
	(isOpen) => {
		if (isOpen) {
			newFileName.value = props.fileName;
		}
	},
);

function handleSubmit() {
	if (newFileName.value.trim()) {
		emit("confirm", newFileName.value.trim());
	}
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
          >
            <Pencil class="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div>
            <DialogTitle class="text-left">
              {{ t("files.dialogs.rename.title") }}
            </DialogTitle>
          </div>
        </div>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="py-4 space-y-4">
        <div class="space-y-2">
          <Label for="fileName" class="font-light">
            {{ t("files.dialogs.rename.nameLabel") }}
          </Label>
          <Input
            id="fileName"
            v-model="newFileName"
            :placeholder="t('files.dialogs.rename.namePlaceholder')"
            class="font-light"
            :disabled="isRenaming"
          />
        </div>
      </form>

      <DialogFooter>
        <Button
          variant="outline"
          @click="emit('update:open', false)"
          :disabled="isRenaming"
          class="font-light"
        >
          {{ t("files.dialogs.rename.cancel") }}
        </Button>
        <Button
          @click="handleSubmit"
          :disabled="isRenaming || !newFileName.trim()"
          class="font-light"
        >
          {{ t("files.dialogs.rename.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
