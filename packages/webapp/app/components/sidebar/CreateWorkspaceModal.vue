<script setup lang="ts">
import { ref, computed, watch } from "vue";
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
import { Switch } from "@/components/ui/switch";

const open = defineModel<boolean>("open", { required: true });

// Form state
const displayName = ref("");
const description = ref("");
const keepForDays = ref<string>("");
const autoCleanup = ref(true);
const requireApproval = ref(false);
const maxMembers = ref<string>("");
const maxStorageGb = ref<string>("");
const enableComments = ref(true);

const isFormValid = computed(() => {
	const nameValid = displayName.value.trim().length >= 3;
	const membersValid = !maxMembers.value || parseInt(maxMembers.value) >= 1;
	return nameValid && membersValid;
});

function resetForm() {
	displayName.value = "";
	description.value = "";
	keepForDays.value = "";
	autoCleanup.value = true;
	requireApproval.value = false;
	maxMembers.value = "";
	maxStorageGb.value = "";
	enableComments.value = true;
}

// Reset form when modal closes
watch(open, (isOpen) => {
	if (!isOpen) {
		resetForm();
	}
});

function createWorkspace() {
	// Convert days to seconds (1 day = 86400 seconds)
	const keepForSec = keepForDays.value
		? parseInt(keepForDays.value) * 86400
		: undefined;
	// Convert GB to MB (1 GB = 1024 MB)
	const maxStorageMb = maxStorageGb.value
		? parseInt(maxStorageGb.value) * 1024
		: undefined;

	const workspaceData = {
		display_name: displayName.value.trim(),
		description: description.value.trim() || undefined,
		keep_for_sec: keepForSec,
		auto_cleanup: autoCleanup.value,
		require_approval: requireApproval.value,
		max_members: maxMembers.value ? parseInt(maxMembers.value) : undefined,
		max_storage: maxStorageMb,
		enable_comments: enableComments.value,
	};

	console.log("Creating workspace:", workspaceData);
	// TODO: Implement actual API call

	open.value = false;
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>Create New Workspace</DialogTitle>
        <DialogDescription>
          Set up a new workspace to organize your documents and workflows.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-5 py-4 max-h-[60vh] overflow-y-auto pr-2">
        <!-- Workspace Name -->
        <div class="grid gap-2">
          <Label for="display-name">
            Workspace Name
            <span class="text-red-500">*</span>
          </Label>
          <Input
            id="display-name"
            v-model="displayName"
            placeholder="e.g., Q4 Marketing Campaign"
            maxlength="100"
          />
          <p class="text-xs text-muted-foreground">3-100 characters</p>
        </div>

        <!-- Description -->
        <div class="grid gap-2">
          <Label for="description">Description</Label>
          <Textarea
            id="description"
            v-model="description"
            placeholder="Brief description of your workspace..."
            rows="2"
            maxlength="200"
          />
          <p class="text-xs text-muted-foreground">
            Optional, max 200 characters
          </p>
        </div>

        <!-- File Retention & Storage Limit -->
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="keep-for">File Retention (days)</Label>
            <Input
              id="keep-for"
              v-model="keepForDays"
              type="number"
              min="1"
              max="7"
              placeholder="Unlimited"
            />
          </div>

          <div class="grid gap-2">
            <Label for="max-storage">Storage Limit (GB)</Label>
            <Input
              id="max-storage"
              v-model="maxStorageGb"
              type="number"
              min="1"
              max="1024"
              placeholder="Unlimited"
            />
          </div>
        </div>

        <!-- Max Members -->
        <div class="grid gap-2">
          <Label for="max-members">Max Members</Label>
          <Input
            id="max-members"
            v-model="maxMembers"
            type="number"
            min="1"
            max="1000"
            placeholder="Unlimited"
          />
        </div>

        <!-- Toggle Options -->
        <div class="space-y-4 pt-2">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label for="auto-cleanup">Auto Cleanup</Label>
              <p class="text-xs text-muted-foreground">
                Automatically delete processed files after expiration
              </p>
            </div>
            <Switch id="auto-cleanup" v-model:checked="autoCleanup" />
          </div>

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label for="require-approval">Require Approval</Label>
              <p class="text-xs text-muted-foreground">
                Processed files require approval before being visible
              </p>
            </div>
            <Switch id="require-approval" v-model:checked="requireApproval" />
          </div>

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label for="enable-comments">Enable Comments</Label>
              <p class="text-xs text-muted-foreground">
                Allow team members to comment on documents
              </p>
            </div>
            <Switch id="enable-comments" v-model:checked="enableComments" />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false"> Cancel </Button>
        <Button @click="createWorkspace" :disabled="!isFormValid">
          <Plus :size="16" class="mr-2" />
          Create Workspace
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
