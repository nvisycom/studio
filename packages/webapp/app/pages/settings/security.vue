<script setup lang="ts">
import { ref, computed } from "vue";
import type { DateRange } from "reka-ui";
import type { Ref } from "vue";
import { getLocalTimeZone, today } from "@internationalized/date";
import { Download, Calendar } from "lucide-vue-next";
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
import { RangeCalendar } from "@/components/ui/range-calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

definePageMeta({
	breadcrumbs: [
		{ label: "[project]" },
		{
			label: "Settings",
			href: "/settings",
		},
		{
			label: "Security",
			dropdown: [
				{ label: "General", value: "/settings" },
				{ label: "Billing", value: "/settings/billing" },
				{ label: "Notifications", value: "/settings/notifications" },
				{ label: "Security", value: "/settings/security" },
			],
		},
	],
});

// IP Address Visibility
const showIpInDashboard = ref(true);
const showIpInLogs = ref(true);

// Two-Factor Authentication Enforcement
const enforce2FA = ref(false);

// SAML SSO
const samlEnabled = ref(false);
const samlEntityId = ref("");
const samlSsoUrl = ref("");
const samlCertificate = ref("");

// Audit Log date range
const start = today(getLocalTimeZone());
const end = start.add({ days: 7 });

const auditLogDateRange = ref({
	start,
	end,
}) as Ref<DateRange>;

const isCalendarOpen = ref(false);

const formattedDateRange = computed(() => {
	if (!auditLogDateRange.value.start || !auditLogDateRange.value.end) {
		return "Select date range";
	}

	const startDate = new Date(
		auditLogDateRange.value.start.year,
		auditLogDateRange.value.start.month - 1,
		auditLogDateRange.value.start.day,
	);
	const endDate = new Date(
		auditLogDateRange.value.end.year,
		auditLogDateRange.value.end.month - 1,
		auditLogDateRange.value.end.day,
	);

	const formatter = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
});

// Functions
function saveIpVisibility() {
	console.log("Saving IP visibility settings:", {
		dashboard: showIpInDashboard.value,
		logs: showIpInLogs.value,
	});
}

function save2FAEnforcement() {
	console.log("Saving 2FA enforcement:", enforce2FA.value);
}

function saveSamlSettings() {
	console.log("Saving SAML settings:", {
		enabled: samlEnabled.value,
		entityId: samlEntityId.value,
		ssoUrl: samlSsoUrl.value,
	});
}

function exportAuditLog(format: "csv" | "json") {
	console.log(
		`Exporting audit log as ${format.toUpperCase()}`,
		auditLogDateRange.value,
	);
	// Implement export logic
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Security
        </h1>
        <p class="text-neutral-600 dark:text-neutral-400">
          Configure security policies and access controls for your project
        </p>
      </div>

      <div class="space-y-6">

        <!-- IP Address Visibility -->
        <Card class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800" id="ip-address-visibility">
          <CardHeader>
            <CardTitle>IP Address Visibility</CardTitle>
            <CardDescription>Control where IP addresses are visible in your project</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4 pl-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-neutral-900 dark:text-white">
                    Dashboard Visibility
                  </p>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    IP addresses are currently {{ showIpInDashboard ? 'visible' : 'hidden' }} in Dashboard
                  </p>
                </div>
                <Switch v-model:checked="showIpInDashboard" />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-neutral-900 dark:text-white">
                    Logs Visibility
                  </p>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    IP addresses are currently {{ showIpInLogs ? 'visible' : 'hidden' }} in Logs
                  </p>
                </div>
                <Switch v-model:checked="showIpInLogs" />
              </div>
            </div>
          </CardContent>
          <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Under some laws, IP addresses are considered personal information and may be subject to privacy regulations. Hiding IP addresses improves privacy but may limit troubleshooting capabilities.
            </p>
            <Button size="sm" @click="saveIpVisibility">
              Save
            </Button>
          </CardFooter>
        </Card>

        <!-- Two-Factor Authentication Enforcement -->
        <Card class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800" id="two-factor-authentication-enforcement">
          <CardHeader>
            <CardTitle>Two-Factor Authentication Enforcement</CardTitle>
            <CardDescription>Require all project members to enable two-factor authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  Require all project members to enable two-factor authentication
                </p>
              </div>
              <Switch v-model:checked="enforce2FA" class="ml-4" />
            </div>
          </CardContent>
          <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Enabling 2FA enforcement significantly improves account security. Members without 2FA will be prompted to set it up. <NuxtLink to="/members" class="inline-flex items-center gap-1 text-neutral-900 dark:text-white hover:underline font-medium">View member 2FA status</NuxtLink>
            </p>
            <Button size="sm" @click="save2FAEnforcement">
              Save
            </Button>
          </CardFooter>
        </Card>

        <!-- SAML Single Sign-On -->
        <Card class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800" id="saml-single-sign-on">
          <CardHeader>
            <CardTitle>SAML Single Sign-On</CardTitle>
            <CardDescription>Configure SAML-based single sign-on for your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex items-center justify-between mb-4">
              <div class="flex-1">
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  Enable SAML-based single sign-on
                </p>
              </div>
              <Switch v-model:checked="samlEnabled" class="ml-4" />
            </div>

            <div v-if="samlEnabled" class="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Entity ID
                </label>
                <input
                  v-model="samlEntityId"
                  type="text"
                  placeholder="https://your-idp.com/entity-id"
                  class="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  SSO URL
                </label>
                <input
                  v-model="samlSsoUrl"
                  type="text"
                  placeholder="https://your-idp.com/sso"
                  class="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  X.509 Certificate
                </label>
                <textarea
                  v-model="samlCertificate"
                  rows="4"
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  class="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              SAML SSO allows your organization to manage authentication through your identity provider.
            </p>
            <Button size="sm" @click="saveSamlSettings">
              Save
            </Button>
          </CardFooter>
        </Card>

        <!-- Audit Log -->
        <Card class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800" id="audit-log">
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>Export security and activity logs for compliance and auditing</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-3">
                  Date Range
                </label>
                <div class="flex items-center gap-3">
                  <Popover v-model:open="isCalendarOpen">
                    <PopoverTrigger as-child>
                      <Button variant="outline" class="justify-start text-left font-normal min-w-[280px]">
                        <Calendar :size="16" class="mr-2" />
                        {{ formattedDateRange }}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0" align="start">
                      <RangeCalendar v-model="auditLogDateRange" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div class="flex gap-3">
                <Button
                  @click="exportAuditLog('csv')"
                  variant="outline"
                  class="flex items-center gap-2"
                >
                  <Download :size="16" />
                  Export CSV
                </Button>
                <Button
                  @click="exportAuditLog('json')"
                  variant="outline"
                  class="flex items-center gap-2"
                >
                  <Download :size="16" />
                  Export JSON
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Audit logs include all security events, user activity, and system changes within the selected date range.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>
