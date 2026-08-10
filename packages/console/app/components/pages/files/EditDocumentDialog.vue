<script setup lang="ts">
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import { Button } from "#console/components/ui/button";
import { Label } from "#console/components/ui/label";
import { Switch } from "#console/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";

interface Props {
	open: boolean;
	visualSupport: boolean;
	contentSegmentation: string;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(
		e: "save",
		data: { visualSupport: boolean; contentSegmentation: string },
	): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

const localVisualSupport = ref(props.visualSupport);
const localContentSegmentation = ref(props.contentSegmentation);

watch(
	() => props.open,
	(newVal) => {
		if (newVal) {
			localVisualSupport.value = props.visualSupport;
			localContentSegmentation.value = props.contentSegmentation;
		}
	},
);

function handleSave() {
	emit("save", {
		visualSupport: localVisualSupport.value,
		contentSegmentation: localContentSegmentation.value,
	});
	emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("files.corpus.edit.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("files.corpus.edit.description") }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="flex items-center justify-between">
          <Label for="visual-support">
            {{ t("files.corpus.edit.visualSupport") }}
          </Label>
          <Switch id="visual-support" v-model="localVisualSupport" />
        </div>
        <div class="flex items-center justify-between">
          <Label for="content-segmentation">
            {{ t("files.corpus.edit.contentSegmentation") }}
          </Label>
          <Select v-model="localContentSegmentation">
            <SelectTrigger id="content-segmentation" class="w-[180px]">
              <SelectValue
                :placeholder="t('files.corpus.edit.segmentationPlaceholder')"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {{ t("files.corpus.edit.segmentation.none") }}
              </SelectItem>
              <SelectItem value="semantic">
                {{ t("files.corpus.edit.segmentation.semantic") }}
              </SelectItem>
              <SelectItem value="fixed">
                {{ t("files.corpus.edit.segmentation.fixed") }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          {{ t("files.corpus.edit.cancel") }}
        </Button>
        <Button @click="handleSave">{{ t("files.corpus.edit.save") }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
