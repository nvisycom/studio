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

const isOpen = defineModel<boolean>("open", { required: true });

const feedbackCategories = [
	{ value: "bug", label: "Bug Report" },
	{ value: "feature", label: "Feature Request" },
	{ value: "improvement", label: "Improvement" },
	{ value: "question", label: "Question" },
	{ value: "other", label: "Other" },
];

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

	toast("Feedback submitted", {
		description: "Thank you for your feedback! \nWe'll review it shortly.",
		action: {
			label: "Undo",
		},
	});

	closeModal();
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Send Feedback</DialogTitle>
        <DialogDescription>
          We'd love to hear your thoughts, suggestions, or issues you're experiencing.
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="feedback-category">Category</Label>
          <Select v-model="feedbackForm.category">
            <SelectTrigger id="feedback-category" class="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="category in feedbackCategories"
                  :key="category.value"
                  :value="category.value"
                >
                  {{ category.label }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="feedback-name">Name</Label>
            <Input
              id="feedback-name"
              v-model="feedbackForm.name"
              placeholder="Your name"
            />
          </div>
          <div class="space-y-2">
            <Label for="feedback-email">Email</Label>
            <Input
              id="feedback-email"
              v-model="feedbackForm.email"
              type="email"
              placeholder="your.email@example.com"
            />
          </div>
        </div>
        <div class="space-y-2">
          <Label for="feedback-message">Message</Label>
          <Textarea
            id="feedback-message"
            v-model="feedbackForm.message"
            placeholder="Tell us what you think..."
            rows="5"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeModal">Cancel</Button>
        <Button @click="submitFeedback">Submit Feedback</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
