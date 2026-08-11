<script setup lang="ts">
import { ChevronDown, Loader2, Eye, EyeOff } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { AvatarUploadCard } from "#console/components/common";
import { personLabel } from "#console/utils/naming";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import { toast } from "vue-sonner";

useHead({ title: "Account" });

definePageMeta({
	pageCategory: "header.category.settings",
});

const {
	account,
	displayName: accountDisplayName,
	username: accountUsername,
	emailAddress,
	avatarUrl: accountAvatarUrl,
	isLoading,
	updateAccountAsync,
	isUpdating,
	uploadAvatarAsync,
	isUploadingAvatar,
	deleteAvatarAsync,
	isDeletingAvatar,
} = useAccount();
const { resolveAvatarUrl } = useAvatarUrl();

// Username: lowercase alphanumeric with single internal dashes (matches signup).
const USERNAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Avatar placeholder must match the sidebar (NavUser) exactly — same person
// fallback (display name → username → email) so both show identical initials
// and gradient color (the gradient is hashed from this string).
const avatarLabel = computed(() =>
	personLabel({
		displayName: accountDisplayName.value,
		username: accountUsername.value,
		emailAddress: emailAddress.value,
	}),
);

// Resolved avatar image URL for display (undefined when unset).
const avatarSrc = computed(() => resolveAvatarUrl(accountAvatarUrl.value));

// Form state
// Local object-URL shown for instant feedback while an upload is in flight;
// cleared once the refreshed account carries the server-side avatarUrl.
const previewUrl = ref("");
const displayImage = computed(() => previewUrl.value || avatarSrc.value);
const displayName = ref("");
const username = ref("");
const email = ref("");

const usernameError = computed(() => {
	const value = username.value.trim();
	if (!value) return "Username is required.";
	return USERNAME_PATTERN.test(value)
		? ""
		: "Use lowercase letters, numbers, and single dashes between characters.";
});
const timezone = ref("America/New_York");

// Password fields
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const passwordError = ref("");
const passwordSuccess = ref(false);
const isUpdatingPassword = ref(false);

// Initialize form from account data
watch(
	account,
	(acc) => {
		if (acc) {
			displayName.value = acc.displayName || "";
			username.value = acc.username || "";
			email.value = acc.emailAddress || "";
		}
	},
	{ immediate: true },
);

// Common timezones
const timezones = [
	{ label: "(UTC-12:00) International Date Line West", value: "Etc/GMT+12" },
	{ label: "(UTC-11:00) Midway Island, Samoa", value: "Pacific/Midway" },
	{ label: "(UTC-10:00) Hawaii", value: "Pacific/Honolulu" },
	{ label: "(UTC-09:00) Alaska", value: "America/Anchorage" },
	{
		label: "(UTC-08:00) Pacific Time (US & Canada)",
		value: "America/Los_Angeles",
	},
	{ label: "(UTC-07:00) Mountain Time (US & Canada)", value: "America/Denver" },
	{ label: "(UTC-06:00) Central Time (US & Canada)", value: "America/Chicago" },
	{
		label: "(UTC-05:00) Eastern Time (US & Canada)",
		value: "America/New_York",
	},
	{ label: "(UTC-04:00) Atlantic Time (Canada)", value: "America/Halifax" },
	{
		label: "(UTC-03:00) Buenos Aires, Georgetown",
		value: "America/Argentina/Buenos_Aires",
	},
	{ label: "(UTC-02:00) Mid-Atlantic", value: "Atlantic/South_Georgia" },
	{ label: "(UTC-01:00) Azores", value: "Atlantic/Azores" },
	{ label: "(UTC+00:00) London, Dublin, Lisbon", value: "Europe/London" },
	{ label: "(UTC+01:00) Berlin, Paris, Rome, Madrid", value: "Europe/Paris" },
	{ label: "(UTC+02:00) Cairo, Helsinki, Kyiv", value: "Europe/Helsinki" },
	{ label: "(UTC+03:00) Moscow, Istanbul, Riyadh", value: "Europe/Moscow" },
	{ label: "(UTC+04:00) Dubai, Baku", value: "Asia/Dubai" },
	{ label: "(UTC+05:00) Karachi, Tashkent", value: "Asia/Karachi" },
	{ label: "(UTC+05:30) Mumbai, Kolkata, New Delhi", value: "Asia/Kolkata" },
	{ label: "(UTC+06:00) Dhaka, Almaty", value: "Asia/Dhaka" },
	{ label: "(UTC+07:00) Bangkok, Hanoi, Jakarta", value: "Asia/Bangkok" },
	{
		label: "(UTC+08:00) Beijing, Hong Kong, Singapore",
		value: "Asia/Shanghai",
	},
	{ label: "(UTC+09:00) Tokyo, Seoul", value: "Asia/Tokyo" },
	{ label: "(UTC+10:00) Sydney, Melbourne", value: "Australia/Sydney" },
	{ label: "(UTC+11:00) Solomon Islands", value: "Pacific/Guadalcanal" },
	{ label: "(UTC+12:00) Auckland, Fiji", value: "Pacific/Auckland" },
] as const;

// Get timezone label
function getTimezoneLabel(value: string): string {
	const tz = timezones.find((t) => t.value === value);
	return tz?.label || value;
}

// Functions
function pickAvatar() {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = "image/*";
	input.onchange = (e) => {
		const file = (e.target as HTMLInputElement)?.files?.[0];
		if (file) uploadAvatar(file);
	};
	input.click();
}

async function uploadAvatar(file: File) {
	// Show the picked file immediately while the upload round-trips.
	previewUrl.value = URL.createObjectURL(file);
	try {
		await uploadAvatarAsync(file);
		toast.success("Avatar updated");
	} catch (error) {
		toast.error("Failed to upload avatar", {
			description: error instanceof Error ? error.message : undefined,
		});
	} finally {
		URL.revokeObjectURL(previewUrl.value);
		previewUrl.value = "";
	}
}

async function removeAvatar() {
	try {
		await deleteAvatarAsync();
		toast.success("Avatar removed");
	} catch (error) {
		toast.error("Failed to remove avatar", {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function saveProfile() {
	if (usernameError.value) return;
	try {
		await updateAccountAsync({
			displayName: displayName.value,
			username: username.value.trim(),
		});
	} catch {
		// Error is handled by the mutation
	}
}

async function savePassword() {
	passwordError.value = "";
	passwordSuccess.value = false;

	if (!newPassword.value) {
		passwordError.value = "New password is required";
		return;
	}

	if (newPassword.value.length < 8) {
		passwordError.value = "Password must be at least 8 characters";
		return;
	}

	if (newPassword.value !== confirmPassword.value) {
		passwordError.value = "Passwords do not match";
		return;
	}

	isUpdatingPassword.value = true;
	try {
		await updateAccountAsync({
			password: newPassword.value,
		});
		passwordSuccess.value = true;
		currentPassword.value = "";
		newPassword.value = "";
		confirmPassword.value = "";
		setTimeout(() => {
			passwordSuccess.value = false;
		}, 3000);
	} catch {
		passwordError.value = "Failed to update password. Please try again.";
	} finally {
		isUpdatingPassword.value = false;
	}
}

function saveTimezone() {
	// TODO: Save timezone to server
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-3xl mx-auto w-full">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <div v-else class="space-y-6">
        <!-- Avatar Card -->
        <AvatarUploadCard
          :name="avatarLabel"
          :src="displayImage"
          label="Avatar"
          description="Click to upload. Recommended: 256x256px. PNG, JPG, or GIF."
          footer="Your profile picture will be visible to other team members."
          remove-label="Remove avatar"
          :is-uploading="isUploadingAvatar"
          :is-deleting="isDeletingAvatar"
          @pick="pickAvatar"
          @remove="removeAvatar"
        />

        <!-- Profile Info Card -->
        <Card class="py-0 pt-6 border-border/50">
          <CardContent class="space-y-5">
            <!-- Display Name -->
            <div class="space-y-2">
              <Label for="displayName" class="text-sm font-medium" required
                >Display Name</Label
              >
              <Input
                id="displayName"
                v-model="displayName"
                placeholder="John Doe"
                class="max-w-md h-9"
              />
              <p class="text-xs text-muted-foreground">
                Your name as it appears across the platform. Max 64 characters.
              </p>
            </div>

            <!-- Username -->
            <div class="space-y-2">
              <Label for="username" class="text-sm font-medium" required
                >Username</Label
              >
              <Input
                id="username"
                v-model="username"
                placeholder="john-doe"
                class="max-w-md h-9"
                autocapitalize="none"
                autocomplete="username"
                :aria-invalid="!!usernameError"
              />
              <p v-if="usernameError" class="text-xs text-destructive">
                {{ usernameError }}
              </p>
              <p v-else class="text-xs text-muted-foreground">
                Your public handle. Lowercase letters, numbers, and single
                dashes.
              </p>
            </div>

          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-xs text-muted-foreground">
              This information will be used across all your workspaces.
            </p>
            <Button size="sm" @click="saveProfile" :disabled="isUpdating">
              <Loader2 v-if="isUpdating" :size="16" class="mr-2 animate-spin" />
              Save
            </Button>
          </CardFooter>
        </Card>

        <!-- Email & Password Card -->
        <Card class="py-0 pt-6 border-border/50">
          <CardContent class="space-y-5">
            <!-- Email Address -->
            <div class="space-y-2">
              <Label for="email" class="text-sm font-medium" required
                >Email Address</Label
              >
              <Input
                id="email"
                v-model="email"
                type="email"
                readonly
                class="max-w-md h-9 bg-muted/50 text-muted-foreground"
              />
              <p class="text-xs text-muted-foreground">
                To change your email address, please contact support.
              </p>
            </div>

            <!-- Password Update Section -->
            <div class="border-t border-border/50 pt-5 space-y-4">
              <!-- Current Password -->
              <div class="space-y-2">
                <Label for="currentPassword" class="text-sm font-medium"
                  >Current Password</Label
                >
                <div class="relative max-w-md">
                  <Input
                    id="currentPassword"
                    v-model="currentPassword"
                    :type="showCurrentPassword ? 'text' : 'password'"
                    placeholder="Enter current password"
                    class="pr-10 h-9"
                  />
                  <button
                    type="button"
                    @click="showCurrentPassword = !showCurrentPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <EyeOff v-if="showCurrentPassword" :size="16" />
                    <Eye v-else :size="16" />
                  </button>
                </div>
              </div>

              <!-- New Password -->
              <div class="space-y-2">
                <Label for="newPassword" class="text-sm font-medium" required
                  >New Password</Label
                >
                <div class="relative max-w-md">
                  <Input
                    id="newPassword"
                    v-model="newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    placeholder="Enter new password"
                    class="pr-10 h-9"
                  />
                  <button
                    type="button"
                    @click="showNewPassword = !showNewPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <EyeOff v-if="showNewPassword" :size="16" />
                    <Eye v-else :size="16" />
                  </button>
                </div>
                <p class="text-xs text-muted-foreground">
                  Minimum 8 characters.
                </p>
              </div>

              <!-- Confirm Password -->
              <div class="space-y-2">
                <Label for="confirmPassword" class="text-sm font-medium" required
                  >Confirm New Password</Label
                >
                <div class="relative max-w-md">
                  <Input
                    id="confirmPassword"
                    v-model="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    placeholder="Confirm new password"
                    class="pr-10 h-9"
                  />
                  <button
                    type="button"
                    @click="showConfirmPassword = !showConfirmPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <EyeOff v-if="showConfirmPassword" :size="16" />
                    <Eye v-else :size="16" />
                  </button>
                </div>
              </div>

              <!-- Error/Success Messages -->
              <p v-if="passwordError" class="text-sm text-destructive">
                {{ passwordError }}
              </p>
              <p
                v-if="passwordSuccess"
                class="text-sm text-green-600 dark:text-green-400"
              >
                Password updated successfully.
              </p>
            </div>
          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-xs text-muted-foreground">
              You'll need to sign in again after changing your password.
            </p>
            <Button
              size="sm"
              @click="savePassword"
              :disabled="isUpdatingPassword || !newPassword"
            >
              <Loader2
                v-if="isUpdatingPassword"
                :size="16"
                class="mr-2 animate-spin"
              />
              Update Password
            </Button>
          </CardFooter>
        </Card>

        <!-- Timezone Card -->
        <Card class="py-0 pt-6 border-border/50">
          <CardContent>
            <div class="space-y-2">
              <Label for="timezone" class="text-sm font-medium">Timezone</Label>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="outline"
                    size="sm"
                    class="w-full max-w-md justify-between text-left font-normal h-9"
                  >
                    <span class="truncate text-sm">{{
                      getTimezoneLabel(timezone)
                    }}</span>
                    <ChevronDown
                      :size="14"
                      class="shrink-0 ml-2 text-muted-foreground"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  class="w-[400px] max-h-[300px] overflow-y-auto"
                >
                  <DropdownMenuItem
                    v-for="tz in timezones"
                    :key="tz.value"
                    @click="timezone = tz.value"
                    class="cursor-pointer text-sm"
                  >
                    {{ tz.label }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <p class="text-xs text-muted-foreground">
                All timestamps will be displayed in this timezone.
              </p>
            </div>
          </CardContent>
          <CardFooter
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-xs text-muted-foreground">
              Changes will take effect immediately.
            </p>
            <Button size="sm" @click="saveTimezone"> Save </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>
