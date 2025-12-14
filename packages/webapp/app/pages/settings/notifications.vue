<script setup lang="ts">
import { ref } from "vue";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Switch from "@/components/ui/switch/Switch.vue";
import Checkbox from "@/components/ui/checkbox/Checkbox.vue";

definePageMeta({
	pageName: "Settings",
});

// Reactive data
const webNotifications = ref(true); // Always true, read-only

const notificationCategories = ref({
	// Documents
	documentsRedacted: { web: true, email: true },
	documentsVerified: { web: true, email: true },

	// Team Members
	memberJoined: { web: true, email: true },
	memberRoleChanged: { web: true, email: true },
	memberLeftOrKicked: { web: true, email: true },

	// Integrations
	integrationConnected: { web: true, email: true },
	integrationDisconnected: { web: true, email: true },
	integrationFailure: { web: true, email: true },

	// Billing
	billingUpcomingPayment: { web: true, email: true },
	billingPlanUpdated: { web: true, email: true },

	// Security
	security2faChanges: { web: true, email: true },
	securitySuspiciousActivity: { web: true, email: true },
});

const categories = [
	{
		id: "documents",
		name: "Documents",
		notifications: [
			{
				key: "documentsRedacted",
				name: "Document Redacted",
				description: "Documents are successfully redacted",
			},
			{
				key: "documentsVerified",
				name: "Document Verified",
				description: "Documents pass verification checks",
			},
		],
	},
	{
		id: "members",
		name: "Team Members",
		notifications: [
			{
				key: "memberJoined",
				name: "Member Joined",
				description: "New members join your project",
			},
			{
				key: "memberRoleChanged",
				name: "Role Changed",
				description: "Member roles are updated",
			},
			{
				key: "memberLeftOrKicked",
				name: "Member Left or Kicked",
				description: "Members leave or are removed from the project",
			},
		],
	},
	{
		id: "integrations",
		name: "Integrations",
		notifications: [
			{
				key: "integrationConnected",
				name: "Integration Connected",
				description: "New integrations are connected to your project",
			},
			{
				key: "integrationDisconnected",
				name: "Integration Disconnected",
				description: "Integrations are disconnected",
			},
			{
				key: "integrationFailure",
				name: "Integration Failure",
				description: "Integrations encounter errors or failures",
			},
		],
	},
	{
		id: "billing",
		name: "Billing",
		notifications: [
			{
				key: "billingUpcomingPayment",
				name: "Upcoming Payment",
				description: "Payment due date is approaching",
			},
			{
				key: "billingPlanUpdated",
				name: "Plan Updated",
				description: "Subscription plan is modified",
			},
		],
	},
	{
		id: "security",
		name: "Security",
		notifications: [
			{
				key: "security2faChanges",
				name: "2FA Changes",
				description: "Two-factor authentication settings are modified",
			},
			{
				key: "securitySuspiciousActivity",
				name: "Suspicious Activity",
				description: "Unusual or potentially malicious activity is detected",
			},
		],
	},
];

// Functions
function saveNotificationCategories() {
	console.log("Saving notification categories:", notificationCategories.value);
}

function updateNotificationSetting(
	key: string,
	channel: "web" | "email",
	value: boolean,
) {
	const setting = (notificationCategories.value as any)[key];
	if (setting) {
		setting[channel] = value;
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <div class="space-y-6">
        <!-- Notification Channels -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
          id="notifications-channels"
        >
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
            <CardDescription
              >Choose where you want to receive notifications</CardDescription
            >
          </CardHeader>
          <CardContent>
            <div class="p-4 rounded-lg bg-white dark:bg-black space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-neutral-900 dark:text-white">
                    Web Notifications
                  </p>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    Always enabled for in-app notifications
                  </p>
                </div>
                <Switch :default-value="true" disabled />
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-neutral-900 dark:text-white">
                    Email Notifications
                  </p>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    Receive notifications via email
                  </p>
                </div>
                <Switch :default-value="true" />
              </div>
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Web notifications are always enabled to ensure you don't miss
              important updates.
            </p>
            <Button size="sm" @click="saveNotificationCategories">
              Save
            </Button>
          </CardFooter>
        </Card>

        <!-- Notification Categories -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
          id="notifications-categories"
        >
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription
              >Choose which notifications you want to receive</CardDescription
            >
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
                      Web
                    </span>
                    <span
                      class="text-xs font-medium text-neutral-600 dark:text-neutral-400 w-16 text-center"
                    >
                      Email
                    </span>
                  </div>
                </div>

                <!-- Category Notifications -->
                <div class="space-y-1 mt-2">
                  <div
                    v-for="notification in category.notifications"
                    :key="notification.key"
                    class="flex items-start justify-between py-2"
                  >
                    <div class="flex-1 pr-4">
                      <p class="text-sm text-neutral-900 dark:text-white">
                        {{ notification.name }}
                      </p>
                      <p
                        class="text-xs text-neutral-600 dark:text-neutral-400 mt-1"
                      >
                        {{ notification.description }}
                      </p>
                    </div>

                    <div class="flex items-center gap-8">
                      <!-- Web Checkbox -->
                      <div class="w-16 flex justify-center">
                        <Checkbox
                          :default-value="
                            (notificationCategories as any)[notification.key]
                              ?.web
                          "
                          @update:checked="
                            (value: boolean) =>
                              updateNotificationSetting(
                                notification.key,
                                'web',
                                value,
                              )
                          "
                        />
                      </div>

                      <!-- Email Checkbox -->
                      <div class="w-16 flex justify-center">
                        <Checkbox
                          :default-value="
                            (notificationCategories as any)[notification.key]
                              ?.email
                          "
                          @update:checked="
                            (value: boolean) =>
                              updateNotificationSetting(
                                notification.key,
                                'email',
                                value,
                              )
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
              Security notifications are highly recommended and cannot be
              disabled for critical alerts.
            </p>
            <Button size="sm" @click="saveNotificationCategories">
              Save
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>
