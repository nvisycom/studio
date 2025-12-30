<script setup lang="ts">
import { ref } from "vue";
import { Upload, ChevronDown } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

definePageMeta({
  pageCategory: "Settings",
});

// User data
const avatarUrl = ref("");
const displayName = ref("John Doe");
const companyName = ref("Acme Inc.");

const email = ref("john@example.com");
const timezone = ref("America/New_York");

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

// Get initials from display name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Get timezone label
function getTimezoneLabel(value: string): string {
  const tz = timezones.find((t) => t.value === value);
  return tz?.label || value;
}

// Functions
function uploadAvatar() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement)?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        avatarUrl.value = event.target?.result as string;
      };
      reader.readAsDataURL(file);
      console.log("Uploading avatar:", file.name);
    }
  };
  input.click();
}

function saveDisplayName() {
  console.log("Saving display name:", displayName.value);
}

function saveCompanyName() {
  console.log("Saving company name:", companyName.value);
}

function saveTimezone() {
  console.log("Saving timezone:", timezone.value);
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <div class="space-y-6">
        <!-- Avatar -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription
              >Your profile picture. Click on the avatar to upload a new
              image.</CardDescription
            >
          </CardHeader>
          <CardContent>
            <button
              @click="uploadAvatar"
              class="group relative hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Avatar class="size-24">
                <AvatarImage v-if="avatarUrl" :src="avatarUrl" />
                <AvatarFallback
                  class="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-medium"
                >
                  {{ getInitials(displayName) }}
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
              Recommended size: 256x256px. Supports PNG, JPG, and GIF formats.
            </p>
          </CardFooter>
        </Card>

        <!-- Display Name -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <CardTitle>Display Name</CardTitle>
            <CardDescription
              >Your name as it appears across the platform</CardDescription
            >
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <Label for="displayName">Display Name</Label>
              <Input
                id="displayName"
                v-model="displayName"
                placeholder="John Doe"
                class="max-w-md"
              />
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Please use 64 characters at maximum.
            </p>
            <Button size="sm" @click="saveDisplayName"> Save </Button>
          </CardFooter>
        </Card>

        <!-- Company Name -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <CardTitle>Company Name</CardTitle>
            <CardDescription
              >The company or organization you represent</CardDescription
            >
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <Label for="companyName">Company Name</Label>
              <Input
                id="companyName"
                v-model="companyName"
                placeholder="Acme Inc."
                class="max-w-md"
              />
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              This may be displayed on documents and invoices.
            </p>
            <Button size="sm" @click="saveCompanyName"> Save </Button>
          </CardFooter>
        </Card>

        <!-- Email Address -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <CardTitle>Email Address</CardTitle>
            <CardDescription
              >Your primary email address for account
              communications</CardDescription
            >
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <Label for="email">Email Address</Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                readonly
                class="max-w-md bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
              />
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              To change your email address, please contact support.
            </p>
          </CardFooter>
        </Card>

        <!-- Timezone -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <CardTitle>Timezone</CardTitle>
            <CardDescription
              >Your preferred timezone for displaying dates and
              times</CardDescription
            >
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <Label for="timezone">Timezone</Label>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="outline"
                    class="w-full max-w-md justify-between text-left font-normal"
                  >
                    <span class="truncate">{{
                      getTimezoneLabel(timezone)
                    }}</span>
                    <ChevronDown :size="16" class="shrink-0 ml-2" />
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
                    class="cursor-pointer"
                  >
                    {{ tz.label }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              All timestamps will be displayed in this timezone.
            </p>
            <Button size="sm" @click="saveTimezone"> Save </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>
