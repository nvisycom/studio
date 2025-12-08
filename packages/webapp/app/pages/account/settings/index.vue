<script setup lang="ts">
import { ref, computed } from "vue";
import {
	Mail,
	Upload,
	Trash2,
	Copy,
	Check,
	Plus,
	MoreHorizontal,
} from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

definePageMeta({
	breadcrumbs: [
		{ label: "[account]" },
		{
			label: "Settings",
			dropdown: [
				{ label: "General", value: "/account/settings/general" },
				{ label: "Authentication", value: "/account/settings/authentication" },
			],
		},
		{ label: "General" },
	],
});

interface EmailAddress {
	id: string;
	email: string;
	isPrimary: boolean;
	isVerified: boolean;
}

// Form data
const displayName = ref("John Doe");
const username = ref("johndoe");
const avatarUrl = ref("");
const defaultProject = ref("My Project");
const userId = ref("usr_1234567890abcdef");

// Email management
const emailAddresses = ref<EmailAddress[]>([
	{
		id: "1",
		email: "john.doe@example.com",
		isPrimary: true,
		isVerified: true,
	},
	{
		id: "2",
		email: "johndoe@gmail.com",
		isPrimary: false,
		isVerified: true,
	},
	{
		id: "3",
		email: "john@company.com",
		isPrimary: false,
		isVerified: false,
	},
]);

// UI state
const isDeleteDialogOpen = ref(false);
const isAddEmailDialogOpen = ref(false);
const deleteConfirmationText = ref("");
const isUserIdCopied = ref(false);
const newEmail = ref("");

// Mock projects data
const projects = [
	{ id: "proj_1", name: "My Project" },
	{ id: "proj_2", name: "Demo Project" },
	{ id: "proj_3", name: "Test Project" },
];

const userInitials = computed(() => {
	const name = displayName.value;
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase();
});

const isDeleteConfirmationValid = computed(() => {
	return deleteConfirmationText.value === "delete my account";
});

// Functions
function updateDisplayName() {
	console.log("Updating display name:", displayName.value);
}

function updateUsername() {
	console.log("Updating username:", username.value);
}

function updateDefaultProject() {
	console.log("Updating default project:", defaultProject.value);
}

function handleAvatarUpload(event: Event) {
	const file = (event.target as HTMLInputElement).files?.[0];
	if (file) {
		const reader = new FileReader();
		reader.onload = (e) => {
			avatarUrl.value = e.target?.result as string;
		};
		reader.readAsDataURL(file);
		console.log("Uploading avatar:", file.name);
	}
}

function removeAvatar() {
	avatarUrl.value = "";
	console.log("Avatar removed");
}

async function copyUserId() {
	try {
		await navigator.clipboard.writeText(userId.value);
		isUserIdCopied.value = true;
		setTimeout(() => {
			isUserIdCopied.value = false;
		}, 2000);
	} catch (err) {
		console.error("Failed to copy user ID:", err);
	}
}

function openDeleteDialog() {
	isDeleteDialogOpen.value = true;
	deleteConfirmationText.value = "";
}

function deleteAccount() {
	if (isDeleteConfirmationValid.value) {
		console.log("Deleting account");
		isDeleteDialogOpen.value = false;
	}
}

function openAddEmailDialog() {
	isAddEmailDialogOpen.value = true;
	newEmail.value = "";
}

function addEmailAddress() {
	if (newEmail.value && newEmail.value.includes("@")) {
		emailAddresses.value.push({
			id: Date.now().toString(),
			email: newEmail.value,
			isPrimary: false,
			isVerified: false,
		});
		isAddEmailDialogOpen.value = false;
		newEmail.value = "";
		console.log("Added email:", newEmail.value);
	}
}

function makePrimaryEmail(emailId: string) {
	emailAddresses.value = emailAddresses.value.map((email) => ({
		...email,
		isPrimary: email.id === emailId,
	}));
	console.log("Made primary:", emailId);
}

function deleteEmail(emailId: string) {
	const email = emailAddresses.value.find((e) => e.id === emailId);
	if (email && !email.isPrimary) {
		emailAddresses.value = emailAddresses.value.filter((e) => e.id !== emailId);
		console.log("Deleted email:", emailId);
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <div class="space-y-6 pb-6">
        <div>
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            General
          </h1>
          <p class="text-neutral-600 dark:text-neutral-400">
            Manage your account information and preferences
          </p>
        </div>

      <!-- Display Name -->
      <Card class="py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
          <CardDescription>Your public display name</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <Label for="displayName">Display Name</Label>
            <Input
              id="displayName"
              v-model="displayName"
              placeholder="Enter display name"
              class="max-w-md"
            />
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            This name will be displayed across the platform.
          </p>
          <Button size="sm" @click="updateDisplayName">
            Save
          </Button>
        </CardFooter>
      </Card>

      <!-- Username -->
      <Card class="py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Username</CardTitle>
          <CardDescription>Your unique username</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <Label for="username">Username</Label>
            <Input
              id="username"
              v-model="username"
              placeholder="username"
              class="max-w-md"
            />
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Your username is used in URLs and must be unique.
          </p>
          <Button size="sm" @click="updateUsername">
            Save
          </Button>
        </CardFooter>
      </Card>

      <!-- Avatar -->
      <Card class="py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Your profile picture. Click on the avatar to upload a new image.</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center gap-4">
            <label for="avatar-upload" class="cursor-pointer">
              <Avatar class="h-16 w-16 hover:opacity-80 transition-opacity">
                <AvatarImage :src="avatarUrl" alt="Avatar" />
                <AvatarFallback
                  class="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-medium"
                >
                  {{ userInitials }}
                </AvatarFallback>
              </Avatar>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleAvatarUpload"
            />
            <Button
              v-if="avatarUrl"
              @click="removeAvatar"
              variant="outline"
              size="sm"
            >
              <Trash2 :size="16" />
            </Button>
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Recommended size: 256x256px. Supports PNG, JPG, and SVG formats.
          </p>
        </CardFooter>
      </Card>

      <!-- Default Project -->
      <Card class="py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Default Project</CardTitle>
          <CardDescription>Project to open by default when you log in</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <Label for="defaultProject">Default Project</Label>
            <Select v-model="defaultProject">
              <SelectTrigger id="defaultProject" class="max-w-md">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="project in projects" :key="project.id" :value="project.name">
                  {{ project.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            This project will be opened automatically when you sign in.
          </p>
          <Button size="sm" @click="updateDefaultProject">
            Save
          </Button>
        </CardFooter>
      </Card>

      <!-- Email Addresses -->
      <Card class="py-0 pt-6 rounded-xl">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Email Addresses</CardTitle>
              <CardDescription>Manage your email addresses for notifications and account recovery</CardDescription>
            </div>
            <Button @click="openAddEmailDialog" size="sm" class="flex items-center gap-2">
              <Plus :size="16" />
              Add Email
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div
              v-for="emailAddr in emailAddresses"
              :key="emailAddr.id"
              class="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <Mail :size="16" class="text-neutral-400 flex-shrink-0" />
                <span class="text-sm text-neutral-900 dark:text-white font-medium truncate">
                  {{ emailAddr.email }}
                </span>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <Badge v-if="emailAddr.isPrimary" variant="default" class="text-xs">
                    Primary
                  </Badge>
                  <Badge
                    v-if="emailAddr.isVerified"
                    variant="secondary"
                    class="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  >
                    Verified
                  </Badge>
                  <Badge
                    v-else
                    variant="secondary"
                    class="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                  >
                    Unverified
                  </Badge>
                </div>
              </div>
              <DropdownMenu v-if="!emailAddr.isPrimary">
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <MoreHorizontal :size="16" />
                    <span class="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-48">
                  <DropdownMenuItem
                    @click="makePrimaryEmail(emailAddr.id)"
                    class="cursor-pointer"
                  >
                    Make Primary
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    @click="deleteEmail(emailAddr.id)"
                    class="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
                  >
                    <Trash2 :size="14" class="mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Your primary email will be used for notifications and account recovery. Verify all emails to ensure account security.
          </p>
        </CardFooter>
      </Card>

      <!-- User ID -->
      <Card class="py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle>User ID</CardTitle>
          <CardDescription>Your unique user identifier</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <Label for="userId">User ID</Label>
            <div class="flex gap-3 max-w-md">
              <Input
                id="userId"
                :value="userId"
                readonly
                class="flex-1 font-mono text-sm bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
              />
              <Button @click="copyUserId" variant="outline" size="sm">
                <Check v-if="isUserIdCopied" :size="16" class="text-green-600" />
                <Copy v-else :size="16" />
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            This ID is used internally and cannot be changed.
          </p>
        </CardFooter>
      </Card>

      <!-- Delete Account -->
      <Card class="py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
          <CardDescription>Permanently delete your account and all associated data</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            This will permanently delete your account and all associated data.
          </p>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-red-50 dark:bg-red-950 rounded-b-xl flex items-center justify-between">
          <p class="text-sm text-red-600 dark:text-red-400">
            This action cannot be undone. All your data will be permanently deleted.
          </p>
          <Button size="sm" variant="destructive" @click="openDeleteDialog">
            Delete Account
          </Button>
        </CardFooter>
      </Card>

      <!-- Add Email Dialog -->
      <Dialog v-model:open="isAddEmailDialogOpen">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Email Address</DialogTitle>
            <DialogDescription>
              Add a new email address to your account. You'll need to verify it before you can use it.
            </DialogDescription>
          </DialogHeader>

          <div class="py-4">
            <Label for="newEmail" class="mb-2">Email Address</Label>
            <Input
              id="newEmail"
              v-model="newEmail"
              type="email"
              placeholder="email@example.com"
              @keyup.enter="addEmailAddress"
            />
          </div>

          <DialogFooter>
            <Button @click="isAddEmailDialogOpen = false" variant="outline">
              Cancel
            </Button>
            <Button
              @click="addEmailAddress"
              :disabled="!newEmail || !newEmail.includes('@')"
            >
              Add Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Delete Account Dialog -->
      <Dialog v-model:open="isDeleteDialogOpen">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>

          <div class="py-4 space-y-4">
            <div class="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                This will permanently delete:
              </h3>
              <ul class="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• Your account and profile</li>
                <li>• All your projects and documents</li>
                <li>• Your API tokens</li>
                <li>• All usage data and history</li>
              </ul>
            </div>

            <div>
              <Label for="deleteConfirmation" class="mb-2">
                Please type <strong>delete my account</strong> to confirm:
              </Label>
              <Input
                id="deleteConfirmation"
                v-model="deleteConfirmationText"
                placeholder="delete my account"
                class="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button @click="isDeleteDialogOpen = false" variant="outline">
              Cancel
            </Button>
            <Button
              @click="deleteAccount"
              :disabled="!isDeleteConfirmationValid"
              variant="destructive"
            >
              <Trash2 :size="16" class="mr-2" />
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  </div>
</template>
