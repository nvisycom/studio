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
} from "@lucide/vue";
import { Progress } from "#console/components/ui/progress";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import { Badge } from "#console/components/ui/badge";

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
  <div class="flex flex-1 flex-col gap-6">
    <div class="max-w-3xl mx-auto w-full">
      <!-- Welcome Section -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-1">
          <h1 class="text-xl font-medium text-foreground tracking-tight">
            {{ t("overview.welcome.title")
            }}<span v-if="firstName">, {{ firstName }}</span
            >!
          </h1>
          <Badge
            v-if="currentWorkspace?.memberRole"
            variant="outline"
            class="capitalize text-xs"
          >
            {{ t(`members.roles.${currentWorkspace.memberRole}`) }}
          </Badge>
        </div>
        <p class="text-sm text-muted-foreground">
          {{
            t("overview.welcome.subtitle", {
              workspace: currentWorkspace?.displayName ?? "",
            })
          }}
        </p>

        <!-- Feature Badges + Tags -->
        <div
          v-if="currentWorkspace"
          class="flex flex-wrap items-center gap-1.5 mt-3"
        >
          <Badge
            v-if="currentWorkspace.requireApproval"
            variant="secondary"
            class="text-xs"
          >
            {{ t("overview.workspace.badges.requireApproval") }}
          </Badge>
          <Badge
            v-if="currentWorkspace.enableComments"
            variant="secondary"
            class="text-xs"
          >
            {{ t("overview.workspace.badges.commentsEnabled") }}
          </Badge>
          <Badge
            v-for="tag in currentWorkspace.tags"
            :key="tag"
            variant="outline"
            class="text-xs"
          >
            {{ tag }}
          </Badge>
        </div>

        <!-- Description -->
        <p
          v-if="currentWorkspace?.description"
          class="text-sm text-muted-foreground mt-3"
        >
          {{ currentWorkspace.description }}
        </p>
      </div>

      <!-- Workspace Stats -->
      <div
        v-if="currentWorkspace"
        class="grid grid-cols-3 gap-6 mb-8 pb-8 border-b border-border/50"
      >
        <!-- Members Count -->
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-md bg-muted/50">
            <Users :size="16" class="text-muted-foreground" />
          </div>
          <div>
            <p class="text-lg font-medium text-foreground">
              {{ members?.length ?? 0 }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ t("overview.workspace.members") }}
            </p>
          </div>
        </div>

        <!-- Files Count -->
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-md bg-muted/50">
            <FileText :size="16" class="text-muted-foreground" />
          </div>
          <div>
            <p class="text-lg font-medium text-foreground">
              {{ files?.length ?? 0 }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ t("overview.workspace.files") }}
            </p>
          </div>
        </div>

        <!-- Created Date -->
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-md bg-muted/50">
            <Calendar :size="16" class="text-muted-foreground" />
          </div>
          <div>
            <p class="text-sm font-medium text-foreground">
              {{ formatDate(currentWorkspace.createdAt) }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ t("overview.workspace.created") }}
            </p>
          </div>
        </div>
      </div>

      <!-- Usage Cards -->
      <div class="grid gap-4 md:grid-cols-2 mb-8">
        <!-- Credits Card -->
        <Card class="border-border/50">
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle
              class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              {{ t("overview.usage.credits") }}
            </CardTitle>
            <CreditCard class="h-4 w-4 text-muted-foreground/50" />
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="flex items-baseline justify-between">
                <div class="text-2xl font-medium text-foreground">
                  {{ creditsUsed.toLocaleString() }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{
                    t("overview.usage.of", {
                      total: creditsTotal.toLocaleString(),
                    })
                  }}
                </div>
              </div>
              <Progress :model-value="creditsPercentage" class="h-1.5" />
              <p class="text-xs text-muted-foreground">
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
        <Card class="border-border/50">
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle
              class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              {{ t("overview.usage.storage") }}
            </CardTitle>
            <Database class="h-4 w-4 text-muted-foreground/50" />
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="flex items-baseline justify-between">
                <div class="text-2xl font-medium text-foreground">
                  {{ storageUsed }} GB
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ t("overview.usage.of", { total: `${storageTotal} GB` }) }}
                </div>
              </div>
              <Progress :model-value="storagePercentage" class="h-1.5" />
              <p class="text-xs text-muted-foreground">
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
      <div>
        <h3
          class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3"
        >
          {{ t("overview.quickActions.title") }}
        </h3>
        <div class="grid grid-cols-3 gap-3">
          <NuxtLink
            v-for="action in quickActions"
            :key="action.title"
            :to="action.href"
            class="group flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/30 transition-colors"
          >
            <div
              class="p-2 rounded-md bg-muted/50 group-hover:bg-muted transition-colors"
            >
              <component
                :is="action.icon"
                class="h-4 w-4 text-muted-foreground"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-foreground">
                {{ action.title }}
              </p>
              <p class="text-xs text-muted-foreground truncate">
                {{ action.description }}
              </p>
            </div>
            <ArrowRight
              class="h-4 w-4 text-muted-foreground/50 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
            />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
