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
	pageName: "Settings",
});

// Reactive data
const projectName = ref("My Awesome Project");
const projectUrl = ref("my-awesome-project");
const copiedProjectId = ref(false);
const copiedProjectUrl = ref(false);

// Functions
function copyProjectId() {
	navigator.clipboard.writeText("proj_1a2b3c4d5e6f");
	copiedProjectId.value = true;
	setTimeout(() => {
		copiedProjectId.value = false;
	}, 2000);
}

function copyProjectUrl() {
	navigator.clipboard.writeText(`https://app.nvisy.com/${projectUrl.value}`);
	copiedProjectUrl.value = true;
	setTimeout(() => {
		copiedProjectUrl.value = false;
	}, 2000);
}

function saveProjectName() {
	console.log("Saving project name:", projectName.value);
}

function saveProjectUrl() {
	console.log("Saving project URL:", projectUrl.value);
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

function leaveProject() {
	console.log("Leaving project");
}

function deleteProject() {
	console.log("Deleting project");
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <div class="space-y-6">
        <!-- Project Name -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <CardTitle>Project Name</CardTitle>
            <CardDescription
              >The name of your project as it appears across the
              platform</CardDescription
            >
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <Label for="projectName">Project Name</Label>
              <Input
                id="projectName"
                v-model="projectName"
                placeholder="My Project"
                class="max-w-md"
              />
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Please use 32 characters at maximum.
            </p>
            <Button size="sm" @click="saveProjectName"> Save </Button>
          </CardFooter>
        </Card>

        <!-- Project URL -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <CardTitle>Project URL</CardTitle>
            <CardDescription>The URL slug for your project</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <Label for="projectUrl">URL Slug</Label>
              <div class="flex items-center gap-2 max-w-lg">
                <div class="flex items-center flex-1">
                  <Input
                    model-value="app.nvisy.com/"
                    readonly
                    class="w-32 bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-r-none border-r-0"
                  />
                  <Input
                    id="projectUrl"
                    v-model="projectUrl"
                    placeholder="my-project"
                    class="flex-1 rounded-l-none"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  @click="copyProjectUrl"
                  class="flex items-center justify-center w-10 h-10 p-0"
                >
                  <Check
                    v-if="copiedProjectUrl"
                    :size="16"
                    class="text-green-500"
                  />
                  <Copy v-else :size="16" />
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Only lowercase letters, numbers, and hyphens are allowed.
            </p>
            <Button size="sm" @click="saveProjectUrl"> Save </Button>
          </CardFooter>
        </Card>

        <!-- Project Avatar -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <CardTitle>Project Avatar</CardTitle>
            <CardDescription
              >Project avatar image. Click on the avatar to upload a new
              image.</CardDescription
            >
          </CardHeader>
          <CardContent>
            <button
              @click="uploadAvatar"
              class="group relative hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Avatar class="size-24">
                <AvatarFallback
                  class="bg-gradient-to-br from-blue-500 to-purple-600"
                >
                </AvatarFallback>
              </Avatar>
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              >
                <Upload :size="24" class="text-white" />
              </div>
            </button>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Recommended size: 256x256px. Supports PNG, JPG, and SVG formats.
            </p>
          </CardFooter>
        </Card>

        <!-- Project ID -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <CardTitle>Project ID</CardTitle>
            <CardDescription
              >Unique identifier for this project</CardDescription
            >
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <Label for="projectId">Project ID</Label>
              <div class="flex gap-2 max-w-md">
                <Input
                  id="projectId"
                  model-value="proj_1a2b3c4d5e6f"
                  readonly
                  class="flex-1 font-mono text-sm bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                />
                <Button
                  variant="outline"
                  size="sm"
                  @click="copyProjectId"
                  class="flex items-center justify-center w-10 h-10 p-0"
                >
                  <Check
                    v-if="copiedProjectId"
                    :size="16"
                    class="text-green-500"
                  />
                  <Copy v-else :size="16" />
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              This is your project's unique identifier used in API calls.
            </p>
          </CardFooter>
        </Card>

        <!-- Leave Project -->
        <Card
          class="py-0 pt-6 border border-red-600 dark:border-red-800 rounded-xl"
        >
          <CardHeader>
            <CardTitle>Leave Project</CardTitle>
            <CardDescription
              >Remove yourself from this project. You won't be able to access it
              anymore.</CardDescription
            >
          </CardHeader>
          <CardContent>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              This action will remove you from the project immediately.
            </p>
          </CardContent>
          <CardFooter
            class="border-t pb-6 border-red-600 dark:border-red-800 bg-red-50 dark:bg-red-500 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-red-600 dark:text-red-400">
              This action cannot be undone. You'll need to be re-invited to
              access this project.
            </p>
            <Button size="sm" variant="destructive" @click="leaveProject">
              Leave Project
            </Button>
          </CardFooter>
        </Card>

        <!-- Delete Project -->
        <Card
          class="py-0 pt-6 border border-red-600 dark:border-red-800 rounded-xl"
        >
          <CardHeader>
            <CardTitle>Delete Project</CardTitle>
            <CardDescription
              >Permanently delete this project and all of its data. This action
              cannot be undone.</CardDescription
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
            <Button size="sm" variant="destructive" @click="deleteProject">
              Delete Project
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>
