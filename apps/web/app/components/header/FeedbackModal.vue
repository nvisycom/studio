<script setup lang="ts">
import { toast } from "vue-sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import { Label } from "#console/components/ui/label";
import { Input } from "#console/components/ui/input";
import { Textarea } from "#console/components/ui/textarea";
import { Button } from "#console/components/ui/button";

const { t } = useI18n();

const isOpen = defineModel<boolean>("open", { required: true });

const feedbackCategories = [
	"bug",
	"feature",
	"improvement",
	"question",
	"other",
] as const;

const feedbackForm = ref({
	category: "",
	name: "",
	email: "",
	message: "",
});

function resetModal(): void {
	feedbackForm.value = {
		category: "",
		name: "",
		email: "",
		message: "",
	};
}

function closeModal(): void {
	isOpen.value = false;
	resetModal();
}

function submitFeedback(): void {
	// TODO: Implement feedback submission

	toast(t("feedback.toastTitle"), {
		description: t("feedback.toastDescription"),
	});

	closeModal();
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
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="feedback-category">{{ t("feedback.categoryLabel") }}</Label>
          <Select v-model="feedbackForm.category">
            <SelectTrigger id="feedback-category" class="w-full">
              <SelectValue :placeholder="t('feedback.categoryPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="category in feedbackCategories"
                  :key="category"
                  :value="category"
                >
                  {{ t(`feedback.categories.${category}`) }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="feedback-name">{{ t("feedback.nameLabel") }}</Label>
            <Input
              id="feedback-name"
              v-model="feedbackForm.name"
              :placeholder="t('feedback.namePlaceholder')"
            />
          </div>
          <div class="space-y-2">
            <Label for="feedback-email">{{ t("feedback.emailLabel") }}</Label>
            <Input
              id="feedback-email"
              v-model="feedbackForm.email"
              type="email"
              :placeholder="t('feedback.emailPlaceholder')"
            />
          </div>
        </div>
        <div class="space-y-2">
          <Label for="feedback-message">{{ t("feedback.messageLabel") }}</Label>
          <Textarea
            id="feedback-message"
            v-model="feedbackForm.message"
            :placeholder="t('feedback.messagePlaceholder')"
            rows="5"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeModal">
          {{ t("feedback.cancel") }}
        </Button>
        <Button @click="submitFeedback">{{ t("feedback.submit") }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
