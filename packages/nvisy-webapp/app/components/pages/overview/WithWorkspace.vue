<script setup lang="ts">
import {
	Upload,
	Users,
	BarChart3,
	ArrowRight,
	CreditCard,
	Database,
	FileText,
	Calendar,
} from "lucide-vue-next";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const { t } = useI18n();
const { firstName } = useAccount();
const { currentWorkspace } = useWorkspaces();
const { members } = useMembers();
const { files } = useFiles();

// Format date
function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

// Usage data (placeholder - should come from API)
const creditsUsed = 15000;
const creditsTotal = 20000;
const creditsRemaining = creditsTotal - creditsUsed;
const creditsPercentage = (creditsUsed / creditsTotal) * 100;

const storageUsed = 45.2;
const storageTotal = 100;
const storageRemaining = storageTotal - storageUsed;
const storagePercentage = (storageUsed / storageTotal) * 100;

// Quick actions
const quickActions = [
	{
		title: t("overview.quickActions.uploadFiles.title"),
		description: t("overview.quickActions.uploadFiles.description"),
		icon: Upload,
		href: "/files",
	},
	{
		title: t("overview.quickActions.manageTeam.title"),
		description: t("overview.quickActions.manageTeam.description"),
		icon: Users,
		href: "/team",
	},
	{
		title: t("overview.quickActions.viewAnalytics.title"),
		description: t("overview.quickActions.viewAnalytics.description"),
		icon: BarChart3,
		href: "/analytics",
	},
];
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Welcome Section -->
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-2">
          <h1
            class="text-3xl font-normal text-black dark:text-white tracking-tight"
          >
            {{ t("overview.welcome.title")
            }}<span v-if="firstName">, {{ firstName }}</span
            >!
          </h1>
          <Badge
            v-if="currentWorkspace?.memberRole"
            variant="outline"
            class="capitalize"
          >
            {{ t(`members.roles.${currentWorkspace.memberRole}`) }}
          </Badge>
        </div>
        <p class="text-base font-light text-neutral-600 dark:text-neutral-400">
          {{
            t("overview.welcome.subtitle", {
              workspace: currentWorkspace?.displayName ?? "",
            })
          }}
        </p>

        <!-- Feature Badges + Tags -->
        <div
          v-if="currentWorkspace"
          class="flex flex-wrap items-center gap-2 mt-3"
        >
          <Badge v-if="currentWorkspace.requireApproval" variant="secondary">
            {{ t("overview.workspace.badges.requireApproval") }}
          </Badge>
          <Badge v-if="currentWorkspace.enableComments" variant="secondary">
            {{ t("overview.workspace.badges.commentsEnabled") }}
          </Badge>
          <Badge
            v-for="tag in currentWorkspace.tags"
            :key="tag"
            variant="outline"
          >
            {{ tag }}
          </Badge>
        </div>

        <!-- Description -->
        <p
          v-if="currentWorkspace?.description"
          class="text-sm text-neutral-600 dark:text-neutral-400 mt-3"
        >
          {{ currentWorkspace.description }}
        </p>
      </div>

      <!-- Workspace Stats Card -->
      <Card
        v-if="currentWorkspace"
        class="mb-6 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardContent class="py-4">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <!-- Members Count -->
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <Users
                  :size="16"
                  class="text-neutral-600 dark:text-neutral-400"
                />
              </div>
              <div>
                <p class="text-lg font-medium text-neutral-900 dark:text-white">
                  {{ members?.length ?? 0 }}
                </p>
                <p class="text-xs text-neutral-600 dark:text-neutral-400">
                  {{ t("overview.workspace.members") }}
                </p>
              </div>
            </div>

            <!-- Files Count -->
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <FileText
                  :size="16"
                  class="text-neutral-600 dark:text-neutral-400"
                />
              </div>
              <div>
                <p class="text-lg font-medium text-neutral-900 dark:text-white">
                  {{ files?.length ?? 0 }}
                </p>
                <p class="text-xs text-neutral-600 dark:text-neutral-400">
                  {{ t("overview.workspace.files") }}
                </p>
              </div>
            </div>

            <!-- Created Date -->
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <Calendar
                  :size="16"
                  class="text-neutral-600 dark:text-neutral-400"
                />
              </div>
              <div>
                <p class="text-sm font-medium text-neutral-900 dark:text-white">
                  {{ formatDate(currentWorkspace.createdAt) }}
                </p>
                <p class="text-xs text-neutral-600 dark:text-neutral-400">
                  {{ t("overview.workspace.created") }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Usage Cards -->
      <div class="grid gap-4 md:grid-cols-2 mb-6">
        <!-- Credits Card -->
        <Card class="rounded-xl border-neutral-200 dark:border-neutral-800">
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle
              class="text-sm font-medium text-neutral-600 dark:text-neutral-400"
              >{{ t("overview.usage.credits") }}</CardTitle
            >
            <CreditCard class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="flex items-baseline justify-between">
                <div class="text-2xl font-medium">
                  {{ creditsUsed.toLocaleString() }}
                </div>
                <div class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{
                    t("overview.usage.of", {
                      total: creditsTotal.toLocaleString(),
                    })
                  }}
                </div>
              </div>
              <Progress :model-value="creditsPercentage" class="h-2" />
              <p class="text-xs text-neutral-600 dark:text-neutral-400">
                {{
                  t("overview.usage.creditsRemaining", {
                    count: creditsRemaining.toLocaleString(),
                  })
                }}
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Storage Card -->
        <Card class="rounded-xl border-neutral-200 dark:border-neutral-800">
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle
              class="text-sm font-medium text-neutral-600 dark:text-neutral-400"
              >{{ t("overview.usage.storage") }}</CardTitle
            >
            <Database class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="flex items-baseline justify-between">
                <div class="text-2xl font-medium">{{ storageUsed }} GB</div>
                <div class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ t("overview.usage.of", { total: `${storageTotal} GB` }) }}
                </div>
              </div>
              <Progress :model-value="storagePercentage" class="h-2" />
              <p class="text-xs text-neutral-600 dark:text-neutral-400">
                {{
                  t("overview.usage.storageRemaining", {
                    count: storageRemaining.toFixed(1),
                  })
                }}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Quick Actions -->
      <Card class="rounded-xl border-neutral-200 dark:border-neutral-800">
        <CardHeader class="pb-2">
          <CardTitle
            class="text-sm font-light tracking-wider uppercase text-neutral-600 dark:text-neutral-400"
            >{{ t("overview.quickActions.title") }}</CardTitle
          >
        </CardHeader>
        <CardContent class="pt-0">
          <div class="grid grid-cols-2 gap-2">
            <NuxtLink
              v-for="action in quickActions"
              :key="action.title"
              :to="action.href"
              class="group flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div
                class="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors"
              >
                <component
                  :is="action.icon"
                  class="h-4 w-4 text-neutral-600 dark:text-neutral-400"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-neutral-900 dark:text-white">
                  {{ action.title }}
                </p>
                <p
                  class="text-xs text-neutral-600 dark:text-neutral-400 truncate"
                >
                  {{ action.description }}
                </p>
              </div>
              <ArrowRight
                class="h-4 w-4 text-neutral-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
              />
            </NuxtLink>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
