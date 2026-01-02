<script setup lang="ts">
import type { NotificationEvent } from "@nvisy/sdk/datatypes";
import { NvisyApiError } from "@nvisy/sdk";
import { Loader2 } from "lucide-vue-next";
import { toast } from "vue-sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

definePageMeta({
	pageCategory: "Settings",
});

const { t } = useI18n();

function getErrorMessage(err: unknown, fallback: string): string {
	if (err instanceof NvisyApiError) {
		return err.message;
	}
	if (err instanceof Error) {
		return err.message;
	}
	return fallback;
}

// Composable
const { settings, isLoading, updateSettingsAsync, isUpdating } =
	useNotificationSettings();

// Local form state
const notifyViaEmail = ref(false);
const appEvents = ref<NotificationEvent[]>([]);
const emailEvents = ref<NotificationEvent[]>([]);

// Initialize form from settings data
watch(
	settings,
	(s) => {
		if (s) {
			notifyViaEmail.value = s.notifyViaEmail;
			appEvents.value = [...s.notificationEventsApp];
			emailEvents.value = [...s.notificationEventsEmail];
		}
	},
	{ immediate: true },
);

// Auto-save when email toggle changes
async function toggleEmailNotifications(value: boolean) {
	notifyViaEmail.value = value;
	try {
		await updateSettingsAsync({
			notifyViaEmail: value,
		});
		toast.success(t("settings.notifications.messages.saved"));
	} catch (err) {
		// Revert on error
		notifyViaEmail.value = !value;
		console.error("Failed to update email notifications:", err);
		toast.error(t("settings.notifications.errors.saveFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}

// Event categories based on NotificationEvent types
const categories = computed(() => [
	{
		id: "comments",
		name: t("settings.notifications.categories.comments.name"),
		events: [
			{
				event: "comment:mention" as NotificationEvent,
				name: t("settings.notifications.categories.comments.mention.name"),
				description: t(
					"settings.notifications.categories.comments.mention.description",
				),
			},
			{
				event: "comment:reply" as NotificationEvent,
				name: t("settings.notifications.categories.comments.reply.name"),
				description: t(
					"settings.notifications.categories.comments.reply.description",
				),
			},
		],
	},
	{
		id: "documents",
		name: t("settings.notifications.categories.documents.name"),
		events: [
			{
				event: "document:uploaded" as NotificationEvent,
				name: t("settings.notifications.categories.documents.uploaded.name"),
				description: t(
					"settings.notifications.categories.documents.uploaded.description",
				),
			},
			{
				event: "document:downloaded" as NotificationEvent,
				name: t("settings.notifications.categories.documents.downloaded.name"),
				description: t(
					"settings.notifications.categories.documents.downloaded.description",
				),
			},
			{
				event: "document:verified" as NotificationEvent,
				name: t("settings.notifications.categories.documents.verified.name"),
				description: t(
					"settings.notifications.categories.documents.verified.description",
				),
			},
		],
	},
	{
		id: "members",
		name: t("settings.notifications.categories.members.name"),
		events: [
			{
				event: "member:invited" as NotificationEvent,
				name: t("settings.notifications.categories.members.invited.name"),
				description: t(
					"settings.notifications.categories.members.invited.description",
				),
			},
			{
				event: "member:joined" as NotificationEvent,
				name: t("settings.notifications.categories.members.joined.name"),
				description: t(
					"settings.notifications.categories.members.joined.description",
				),
			},
		],
	},
	{
		id: "integrations",
		name: t("settings.notifications.categories.integrations.name"),
		events: [
			{
				event: "integration:synced" as NotificationEvent,
				name: t("settings.notifications.categories.integrations.synced.name"),
				description: t(
					"settings.notifications.categories.integrations.synced.description",
				),
			},
			{
				event: "integration:desynced" as NotificationEvent,
				name: t("settings.notifications.categories.integrations.desynced.name"),
				description: t(
					"settings.notifications.categories.integrations.desynced.description",
				),
			},
		],
	},
	{
		id: "system",
		name: t("settings.notifications.categories.system.name"),
		events: [
			{
				event: "system:announcement" as NotificationEvent,
				name: t("settings.notifications.categories.system.announcement.name"),
				description: t(
					"settings.notifications.categories.system.announcement.description",
				),
			},
			{
				event: "system:report" as NotificationEvent,
				name: t("settings.notifications.categories.system.report.name"),
				description: t(
					"settings.notifications.categories.system.report.description",
				),
			},
		],
	},
]);

// Check if event settings have changed (email toggle is auto-saved separately)
const hasEventChanges = computed(() => {
	if (!settings.value) return false;

	const originalAppEvents = settings.value.notificationEventsApp;
	const originalEmailEvents = settings.value.notificationEventsEmail;

	// Convert current sets to sorted arrays for comparison
	const currentAppEvents = Array.from(appEvents.value).sort();
	const currentEmailEvents = Array.from(emailEvents.value).sort();
	const sortedOriginalApp = [...originalAppEvents].sort();
	const sortedOriginalEmail = [...originalEmailEvents].sort();

	if (currentAppEvents.length !== sortedOriginalApp.length) return true;
	if (currentEmailEvents.length !== sortedOriginalEmail.length) return true;

	for (let i = 0; i < currentAppEvents.length; i++) {
		if (currentAppEvents[i] !== sortedOriginalApp[i]) return true;
	}
	for (let i = 0; i < currentEmailEvents.length; i++) {
		if (currentEmailEvents[i] !== sortedOriginalEmail[i]) return true;
	}

	return false;
});

// Toggle event in an array
function toggleAppEvent(event: NotificationEvent, value: boolean) {
	if (value) {
		if (!appEvents.value.includes(event)) {
			appEvents.value = [...appEvents.value, event];
		}
	} else {
		appEvents.value = appEvents.value.filter((e) => e !== event);
	}
}

function toggleEmailEvent(event: NotificationEvent, value: boolean) {
	if (value) {
		if (!emailEvents.value.includes(event)) {
			emailEvents.value = [...emailEvents.value, event];
		}
	} else {
		emailEvents.value = emailEvents.value.filter((e) => e !== event);
	}
}

// Save event settings
async function saveEventSettings() {
	try {
		await updateSettingsAsync({
			notificationEventsApp: appEvents.value,
			notificationEventsEmail: emailEvents.value,
		});
		toast.success(t("settings.notifications.messages.saved"));
	} catch (err) {
		console.error("Failed to save notification settings:", err);
		toast.error(t("settings.notifications.errors.saveFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Loader2 :size="32" class="animate-spin text-neutral-400" />
      </div>

      <div v-else-if="settings" class="space-y-6">
        <!-- Notification Channels -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <CardTitle>{{
              t("settings.notifications.channels.title")
            }}</CardTitle>
            <CardDescription>{{
              t("settings.notifications.channels.description")
            }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-neutral-900 dark:text-white">
                    {{ t("settings.notifications.channels.web.label") }}
                  </p>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ t("settings.notifications.channels.web.description") }}
                  </p>
                </div>
                <Switch :model-value="true" disabled />
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-neutral-900 dark:text-white">
                    {{ t("settings.notifications.channels.email.label") }}
                  </p>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ t("settings.notifications.channels.email.description") }}
                  </p>
                </div>
                <Switch
                  :model-value="notifyViaEmail"
                  :disabled="isUpdating"
                  @update:model-value="toggleEmailNotifications"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              {{ t("settings.notifications.channels.footer") }}
            </p>
          </CardFooter>
        </Card>

        <!-- Notification Events -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
        >
          <CardHeader>
            <CardTitle>{{
              t("settings.notifications.events.title")
            }}</CardTitle>
            <CardDescription>{{
              t("settings.notifications.events.description")
            }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-6">
              <div v-for="category in categories" :key="category.id">
                <!-- Category Header with Web/Email Labels -->
                <div
                  class="flex items-center justify-between pb-2 border-b border-neutral-300 dark:border-neutral-600"
                >
                  <h4
                    class="text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    {{ category.name }}
                  </h4>
                  <div class="flex items-center gap-8">
                    <span
                      class="text-xs font-medium text-neutral-600 dark:text-neutral-400 w-16 text-center"
                    >
                      {{ t("settings.notifications.events.headers.web") }}
                    </span>
                    <span
                      class="text-xs font-medium text-neutral-600 dark:text-neutral-400 w-16 text-center"
                    >
                      {{ t("settings.notifications.events.headers.email") }}
                    </span>
                  </div>
                </div>

                <!-- Category Events -->
                <div class="space-y-1 mt-2">
                  <div
                    v-for="item in category.events"
                    :key="item.event"
                    class="flex items-start justify-between py-2"
                  >
                    <div class="flex-1 pr-4">
                      <p class="text-sm text-neutral-900 dark:text-white">
                        {{ item.name }}
                      </p>
                      <p
                        class="text-xs text-neutral-600 dark:text-neutral-400 mt-1"
                      >
                        {{ item.description }}
                      </p>
                    </div>

                    <div class="flex items-center gap-8">
                      <!-- Web Checkbox -->
                      <div class="w-16 flex justify-center">
                        <Checkbox
                          :model-value="appEvents.includes(item.event)"
                          @update:model-value="
                            (value: boolean | 'indeterminate') =>
                              toggleAppEvent(item.event, value === true)
                          "
                        />
                      </div>

                      <!-- Email Checkbox -->
                      <div class="w-16 flex justify-center">
                        <Checkbox
                          :model-value="emailEvents.includes(item.event)"
                          :disabled="!notifyViaEmail"
                          @update:model-value="
                            (value: boolean | 'indeterminate') =>
                              toggleEmailEvent(item.event, value === true)
                          "
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              {{ t("settings.notifications.events.footer") }}
            </p>
            <Button
              size="sm"
              @click="saveEventSettings"
              :disabled="isUpdating || !hasEventChanges"
            >
              <Loader2 v-if="isUpdating" :size="16" class="mr-2 animate-spin" />
              {{ t("common.save") }}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <!-- No settings state -->
      <div v-else class="flex items-center justify-center py-12">
        <p class="text-neutral-500 dark:text-neutral-400">
          {{ t("settings.notifications.noSettings") }}
        </p>
      </div>
    </div>
  </div>
</template>
