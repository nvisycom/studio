<script setup lang="ts">
import { ref } from "vue";
import { Copy, Check } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
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
	token: string | null;
}

type Emits = (e: "update:open", value: boolean) => void;

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

const copied = ref(false);

async function copyToken() {
	if (!props.token) return;

	try {
		await navigator.clipboard.writeText(props.token);
		copied.value = true;
		setTimeout(() => {
			copied.value = false;
		}, 2000);
	} catch (err) {}
}

function closeModal() {
	emit("update:open", false);
	copied.value = false;
}
</script>

<template>
  <Dialog :open="open" @update:open="closeModal">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("tokens.modals.created.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("tokens.modals.created.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="relative">
          <Input
            :model-value="token || ''"
            readonly
            class="font-mono text-sm pr-12"
          />
          <Button
            @click="copyToken"
            size="sm"
            variant="ghost"
            class="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            :class="copied ? 'text-green-500' : ''"
          >
            <Check v-if="copied" :size="16" />
            <Copy v-else :size="16" />
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button @click="closeModal">{{
          t("tokens.modals.created.doneButton")
        }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
