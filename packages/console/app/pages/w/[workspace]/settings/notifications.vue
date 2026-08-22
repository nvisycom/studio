<script setup lang="ts">
import type { NotificationEvent } from "@nvisy/sdk/datatypes";
import { Loader2 } from "@lucide/vue";
import { toast } from "vue-sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import { Button } from "#console/components/ui/button";
import { Switch } from "#console/components/ui/switch";
import { Checkbox } from "#console/components/ui/checkbox";

useHead({ title: "Notifications" });

definePageMeta({
	pageCategory: "header.category.settings",
});

const { t } = useI18n();

// Composable
const { settings, isLoading, updateSettingsAsync, isUpdating } =
	useNotificationSettings();

// Local form state
const notifyViaEmail = ref(false);
const appEvents = ref<NotificationEvent[]>([]);
const emailEvents = ref<NotificationEvent[]>([]);

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
		toast.error(t("settings.notifications.errors.saveFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}

// Notification categories, grouping the backend's NotificationEvent values.
// The event ids carry dots (e.g. "connection.sync.completed"), so the i18n
// leaf keys use dot-free camelCase (syncCompleted, runAnalyzed, ...) to avoid
// vue-i18n treating the dot as a path separator.
const categories = computed<
	{
		id: string;
		name: string;
		events: { event: NotificationEvent; name: string; description: string }[];
	}[]
>(() => [
	{
		id: "members",
		name: t("settings.notifications.categories.members.name"),
		events: [
			{
				event: "member.invited",
				name: t("settings.notifications.categories.members.invited.name"),
				description: t(
					"settings.notifications.categories.members.invited.description",
				),
			},
			{
				event: "member.joined",
				name: t("settings.notifications.categories.members.joined.name"),
				description: t(
					"settings.notifications.categories.members.joined.description",
				),
			},
		],
	},
	{
		id: "connections",
		name: t("settings.notifications.categories.connections.name"),
		events: [
			{
				event: "connection.sync.completed",
				name: t(
					"settings.notifications.categories.connections.syncCompleted.name",
				),
				description: t(
					"settings.notifications.categories.connections.syncCompleted.description",
				),
			},
			{
				event: "connection.sync.failed",
				name: t(
					"settings.notifications.categories.connections.syncFailed.name",
				),
				description: t(
					"settings.notifications.categories.connections.syncFailed.description",
				),
			},
		],
	},
	{
		id: "pipelines",
		name: t("settings.notifications.categories.pipelines.name"),
		events: [
			{
				event: "pipeline.run.analyzed",
				name: t("settings.notifications.categories.pipelines.runAnalyzed.name"),
				description: t(
					"settings.notifications.categories.pipelines.runAnalyzed.description",
				),
			},
			{
				event: "pipeline.run.completed",
				name: t(
					"settings.notifications.categories.pipelines.runCompleted.name",
				),
				description: t(
					"settings.notifications.categories.pipelines.runCompleted.description",
				),
			},
			{
				event: "pipeline.run.failed",
				name: t("settings.notifications.categories.pipelines.runFailed.name"),
				description: t(
					"settings.notifications.categories.pipelines.runFailed.description",
				),
			},
		],
	},
]);

// Order-independent equality for two event lists.
function sameEvents(a: NotificationEvent[], b: NotificationEvent[]) {
	if (a.length !== b.length) return false;
	const set = new Set(a);
	return b.every((event) => set.has(event));
}

// Dirty when either channel's selection diverges from the saved settings
// (the email channel's own on/off toggle is auto-saved separately).
const hasEventChanges = computed(() => {
	if (!settings.value) return false;
	return (
		!sameEvents(appEvents.value, settings.value.notificationEventsApp) ||
		!sameEvents(emailEvents.value, settings.value.notificationEventsEmail)
	);
});

// Initialize the form from settings data. `settings` refetches whenever the
// email toggle auto-saves (updateSettingsAsync invalidates the query), so only
// adopt the server's event lists when the local selection has no unsaved edits
// — otherwise a channel toggle would silently discard in-progress checkboxes.
watch(
	settings,
	(s) => {
		if (!s) return;
		notifyViaEmail.value = s.notifyViaEmail;
		if (!hasEventChanges.value) {
			appEvents.value = [...s.notificationEventsApp];
			emailEvents.value = [...s.notificationEventsEmail];
		}
	},
	{ immediate: true },
);

// Add or remove an event from one channel's selection.
function toggleEvent(
	channel: "app" | "email",
	event: NotificationEvent,
	value: boolean,
) {
	const target = channel === "app" ? appEvents : emailEvents;
	if (value) {
		if (!target.value.includes(event)) target.value = [...target.value, event];
	} else {
		target.value = target.value.filter((e) => e !== event);
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
		toast.error(t("settings.notifications.errors.saveFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-3xl mx-auto w-full">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="settings" class="space-y-6">
        <!-- Notification Channels -->
        <Card class="py-0 pt-6 rounded-xl border-border/50">
          <CardHeader class="pb-4">
            <CardTitle
              class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
              >{{ t("settings.notifications.channels.title") }}</CardTitle
            >
            <CardDescription class="text-sm">{{
              t("settings.notifications.channels.description")
            }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-foreground">
                    {{ t("settings.notifications.channels.web.label") }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ t("settings.notifications.channels.web.description") }}
                  </p>
                </div>
                <Switch :model-value="true" disabled />
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-foreground">
                    {{ t("settings.notifications.channels.email.label") }}
                  </p>
                  <p class="text-xs text-muted-foreground">
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
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl"
          >
            <p class="text-xs text-muted-foreground">
              {{ t("settings.notifications.channels.footer") }}
            </p>
          </CardFooter>
        </Card>

        <!-- Notification Events -->
        <Card class="py-0 pt-6 rounded-xl border-border/50">
          <CardHeader class="pb-4">
            <CardTitle
              class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
              >{{ t("settings.notifications.events.title") }}</CardTitle
            >
            <CardDescription class="text-sm">{{
              t("settings.notifications.events.description")
            }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-6">
              <div v-for="category in categories" :key="category.id">
                <!-- Category Header with Web/Email Labels -->
                <div
                  class="flex items-center justify-between pb-2 border-b border-border/50"
                >
                  <h4 class="text-sm font-medium text-foreground">
                    {{ category.name }}
                  </h4>
                  <div class="flex items-center gap-8">
                    <span
                      class="text-xs font-medium text-muted-foreground w-16 text-center"
                    >
                      {{ t("settings.notifications.events.headers.web") }}
                    </span>
                    <span
                      class="text-xs font-medium text-muted-foreground w-16 text-center"
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
                      <p class="text-sm text-foreground">
                        {{ item.name }}
                      </p>
                      <p class="text-xs text-muted-foreground mt-1">
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
                              toggleEvent('app', item.event, value === true)
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
                              toggleEvent('email', item.event, value === true)
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
            class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-xs text-muted-foreground">
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
        <p class="text-sm text-muted-foreground">
          {{ t("settings.notifications.noSettings") }}
        </p>
      </div>
    </div>
  </div>
</template>
