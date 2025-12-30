<script setup lang="ts">
import { ref } from "vue";
import { Upload, Copy, Check } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

definePageMeta({
	pageCategory: "Settings",
});

// Reactive data
const workspaceName = ref("My Awesome Workspace");
const workspaceId = ref("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
const copiedWorkspaceId = ref(false);

// Functions
function copyWorkspaceId() {
	navigator.clipboard.writeText(workspaceId.value);
	copiedWorkspaceId.value = true;
	setTimeout(() => {
		copiedWorkspaceId.value = false;
	}, 2000);
}

function saveWorkspaceName() {
	console.log("Saving workspace name:", workspaceName.value);
}

function uploadAvatar() {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = "image/*";
	input.onchange = (e) => {
		const file = (e.target as HTMLInputElement)?.files?.[0];
		if (file) {
			console.log("Uploading avatar:", file.name);
		}
	};
	input.click();
}

function leaveWorkspace() {
	console.log("Leaving workspace");
}

function deleteWorkspace() {
	console.log("Deleting workspace");
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <div class="space-y-6">
        <!-- Workspace Avatar -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardContent>
            <div class="flex items-start justify-between">
              <div class="space-y-1">
                <Label>Avatar</Label>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  Click to upload. Recommended: 256x256px. PNG, JPG, or SVG.
                </p>
              </div>
              <button
                @click="uploadAvatar"
                class="group relative hover:opacity-80 transition-opacity cursor-pointer block"
              >
                <Avatar class="size-16">
                  <AvatarFallback
                    class="bg-gradient-to-br from-blue-500 to-purple-600"
                  >
                  </AvatarFallback>
                </Avatar>
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                >
                  <Upload :size="20" class="text-white" />
                </div>
              </button>
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          >
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              Your workspace avatar will be visible to all team members.
            </p>
          </CardFooter>
        </Card>

        <!-- Workspace Info Card -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardContent class="space-y-6">
            <!-- Workspace Name -->
            <div class="space-y-2">
              <Label for="workspaceName">Workspace Name</Label>
              <Input
                id="workspaceName"
                v-model="workspaceName"
                placeholder="My Workspace"
                class="max-w-md"
              />
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                The name of your workspace as it appears across the platform.
              </p>
            </div>

            <!-- Workspace ID -->
            <div class="space-y-2">
              <Label for="workspaceId">Workspace ID</Label>
              <div class="flex gap-2 max-w-md">
                <Input
                  id="workspaceId"
                  :model-value="workspaceId"
                  readonly
                  class="flex-1 font-mono text-sm bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                />
                <Button
                  variant="outline"
                  size="sm"
                  @click="copyWorkspaceId"
                  class="flex items-center justify-center w-10 h-10 p-0"
                >
                  <Check
                    v-if="copiedWorkspaceId"
                    :size="16"
                    class="text-green-500"
                  />
                  <Copy v-else :size="16" />
                </Button>
              </div>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Unique identifier used in API calls.
              </p>
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              Changes will apply to all team members.
            </p>
            <Button size="sm" @click="saveWorkspaceName"> Save </Button>
          </CardFooter>
        </Card>

        <!-- Leave Workspace -->
        <Card
          class="py-0 pt-6 border border-red-600 dark:border-red-800 rounded-xl"
        >
          <CardHeader>
            <CardTitle>Leave Workspace</CardTitle>
            <CardDescription
              >Remove yourself from this workspace. You won't be able to access
              it anymore.</CardDescription
            >
          </CardHeader>
          <CardContent>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              This action will remove you from the workspace immediately.
            </p>
          </CardContent>
          <CardFooter
            class="border-t pb-6 border-red-600 dark:border-red-800 bg-red-50 dark:bg-red-500 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-red-600 dark:text-red-400">
              This action cannot be undone. You'll need to be re-invited to
              access this workspace.
            </p>
            <Button size="sm" variant="destructive" @click="leaveWorkspace">
              Leave Workspace
            </Button>
          </CardFooter>
        </Card>

        <!-- Delete Workspace -->
        <Card
          class="py-0 pt-6 border border-red-600 dark:border-red-800 rounded-xl"
        >
          <CardHeader>
            <CardTitle>Delete Workspace</CardTitle>
            <CardDescription
              >Permanently delete this workspace and all of its data. This
              action cannot be undone.</CardDescription
            >
          </CardHeader>
          <CardContent>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              This will permanently delete everything including data,
              deployments, and configurations.
            </p>
          </CardContent>
          <CardFooter
            class="border-t pb-6 border-red-600 dark:border-red-800 bg-red-50 dark:bg-red-500 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-red-600 dark:text-red-400">
              This will permanently delete everything. This action is
              irreversible.
            </p>
            <Button size="sm" variant="destructive" @click="deleteWorkspace">
              Delete Workspace
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>
