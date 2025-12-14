<script setup lang="ts">
import { ref } from "vue";
import { Plus } from "lucide-vue-next";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const open = defineModel<boolean>("open", { required: true });

const projectName = ref("");
const projectDescription = ref("");

function createProject() {
	console.log("Creating project:", {
		name: projectName.value,
		description: projectDescription.value,
	});
	// TODO: Implement actual project creation

	// Reset form
	projectName.value = "";
	projectDescription.value = "";
	open.value = false;
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogDescription>
          Create a new project to organize your documents and workflows
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="project-name">Project Name</Label>
          <Input
            id="project-name"
            v-model="projectName"
            placeholder="e.g., Q4 Marketing Campaign"
          />
        </div>

        <div class="grid gap-2">
          <Label for="project-description">Description (Optional)</Label>
          <Textarea
            id="project-description"
            v-model="projectDescription"
            placeholder="Brief description of your project..."
            rows="3"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false">
          Cancel
        </Button>
        <Button @click="createProject" :disabled="!projectName.trim()">
          <Plus :size="16" class="mr-2" />
          Create Project
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
