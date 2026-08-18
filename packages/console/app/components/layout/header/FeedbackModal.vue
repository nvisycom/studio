<script setup lang="ts">
import { MessagesSquare } from "@lucide/vue";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import { Button } from "#console/components/ui/button";

const { t } = useI18n();

const isOpen = defineModel<boolean>("open", { required: true });

// Feedback submission has no backend yet. Rather than show an editable form that
// silently discards whatever the user types, the dialog is an honest "coming
// soon" panel pointing at support. Restore the form (category/name/email/
// message + submit) once a feedback endpoint exists.
function closeModal(): void {
	isOpen.value = false;
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("feedback.heading") }}</DialogTitle>
        <DialogDescription>
          {{ t("feedback.description") }}
        </DialogDescription>
      </DialogHeader>

      <div
        class="flex flex-col items-center gap-3 py-6 text-center"
      >
        <MessagesSquare :size="28" class="text-muted-foreground/60" />
        <p class="text-sm font-medium text-foreground">
          {{ t("feedback.comingSoon") }}
        </p>
        <p class="text-sm text-muted-foreground">
          {{ t("feedback.contact") }}
          <a
            href="mailto:support@nvisy.com"
            class="text-foreground underline underline-offset-2"
            >support@nvisy.com</a
          >.
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeModal">
          {{ t("feedback.cancel") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
