<script setup lang="ts">
import {
	ArrowRight,
	BarChart3,
	Check,
	FileText,
	Link2,
	Mail,
	Settings2,
	ShieldCheck,
	Upload,
	Users,
	Webhook as WebhookIcon,
	Workflow,
} from "@lucide/vue";
import type { ActivityType } from "@nvisy/sdk/datatypes";
import type { Component } from "vue";
import { Badge } from "#console/components/ui/badge";
import { getFileIcon, formatFileSize } from "#console/utils/file";

const { t, locale } = useI18n();
const { wLink } = useWorkspaceLink();
const { relativeTime } = useRelativeTime();
const { firstName } = useAccount();
const { currentWorkspace } = useWorkspaces();
const { members } = useMembers();
const { files } = useFiles();
const { policies } = usePolicies();
const { pipelines } = usePipelines();
const { activities } = useActivities({ pageSize: 6 });

// Localized long-form date, following the active UI locale.
const createdOn = computed(() => {
	const created = currentWorkspace.value?.createdAt;
	if (!created) return "";
	return new Date(created).toLocaleDateString(locale.value, {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
});

// --- Setup progress -----------------------------------------------------
// Each step's `done` flag is derived from real data. The overview leads with
// the checklist until every step is complete, then hands over to the live
// dashboard — so a brand-new workspace never shows a grid of zeros.
interface SetupStep {
	key: string;
	icon: Component;
	href: string;
	done: boolean;
}
const setupSteps = computed<SetupStep[]>(() => [
	{
		key: "uploadFiles",
		icon: FileText,
		href: wLink("/files"),
		done: (files.value?.length ?? 0) > 0,
	},
	{
		key: "createPolicy",
		icon: ShieldCheck,
		href: wLink("/policies/new"),
		done: (policies.value?.length ?? 0) > 0,
	},
	{
		key: "inviteTeam",
		icon: Users,
		href: wLink("/team"),
		// The current user already counts as a member, so "invited" means >1.
		done: (members.value?.length ?? 0) > 1,
	},
]);

const allSetUp = computed(() => setupSteps.value.every((s) => s.done));
const activeStepIndex = computed(() =>
	setupSteps.value.findIndex((s) => !s.done),
);

// --- Stat strip ---------------------------------------------------------
interface Stat {
	label: string;
	value: number;
	href: string;
}
const stats = computed<Stat[]>(() => [
	{
		label: t("overview.workspace.files"),
		value: files.value?.length ?? 0,
		href: wLink("/files"),
	},
	{
		label: t("overview.workspace.members"),
		value: members.value?.length ?? 0,
		href: wLink("/team"),
	},
	{
		label: t("overview.workspace.policies"),
		value: policies.value?.length ?? 0,
		href: wLink("/policies"),
	},
	{
		label: t("overview.workspace.pipelines"),
		value: pipelines.value?.length ?? 0,
		href: wLink("/workflows"),
	},
]);

// --- Recent activity ----------------------------------------------------
// Map each activity category to an icon. The description text is provided by
// the API (already human-readable), so we only supply iconography here.
const ACTIVITY_ICON: Record<string, Component> = {
	workspace: Settings2,
	member: Users,
	invite: Mail,
	connection: Link2,
	webhook: WebhookIcon,
	file: FileText,
};
function activityIcon(type: ActivityType): Component {
	const category = type.split(":")[0] ?? "";
	return ACTIVITY_ICON[category] ?? Settings2;
}

const recentFiles = computed(() => (files.value ?? []).slice(0, 5));

// Quick actions (always available)
const quickActions = [
	{
		title: t("overview.quickActions.uploadFiles.title"),
		icon: Upload,
		href: wLink("/files"),
	},
	{
		title: t("overview.quickActions.manageTeam.title"),
		icon: Users,
		href: wLink("/team"),
	},
	{
		title: t("overview.quickActions.viewAnalytics.title"),
		icon: BarChart3,
		href: wLink("/analytics"),
	},
];
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8">
    <!-- Welcome -->
    <div>
      <div class="mb-1 flex flex-wrap items-center gap-3">
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">
          {{ t("overview.welcome.title")
          }}<span v-if="firstName">, {{ firstName }}</span
          >!
        </h1>
        <Badge
          v-if="currentWorkspace?.memberRole"
          variant="outline"
          class="text-xs capitalize"
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

      <div
        v-if="
          currentWorkspace?.settings.requireApproval ||
          currentWorkspace?.tags?.length
        "
        class="mt-3 flex flex-wrap items-center gap-1.5"
      >
        <Badge
          v-if="currentWorkspace?.settings.requireApproval"
          variant="secondary"
          class="text-xs"
        >
          {{ t("overview.workspace.badges.requireApproval") }}
        </Badge>
        <Badge
          v-for="tag in currentWorkspace?.tags"
          :key="tag"
          variant="outline"
          class="text-xs"
        >
          {{ tag }}
        </Badge>
      </div>
    </div>

    <!-- Getting started: shown until every step is complete -->
    <section v-if="!allSetUp">
      <div class="mb-4">
        <h2 class="text-sm font-medium text-foreground">
          {{ t("overview.getStarted.title") }}
        </h2>
        <p class="mt-0.5 text-sm text-muted-foreground">
          {{
            t("overview.getStarted.subtitle", {
              workspace: currentWorkspace?.displayName ?? "",
            })
          }}
        </p>
      </div>

      <div class="divide-y divide-border/60 rounded-xl border border-border/60">
        <NuxtLink
          v-for="(step, i) in setupSteps"
          :key="step.key"
          :to="step.href"
          class="group flex items-center gap-4 px-4 py-3.5 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/40"
        >
          <div
            class="flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors"
            :class="
              step.done
                ? 'border-transparent bg-foreground text-background'
                : i === activeStepIndex
                  ? 'border-foreground/80 text-foreground'
                  : 'border-border text-muted-foreground'
            "
          >
            <Check v-if="step.done" :size="14" :stroke-width="2.5" />
            <component :is="step.icon" v-else :size="14" :stroke-width="1.75" />
          </div>

          <div class="min-w-0 flex-1">
            <p
              class="text-sm font-medium transition-colors"
              :class="
                step.done
                  ? 'text-muted-foreground line-through decoration-border'
                  : 'text-foreground'
              "
            >
              {{ t(`overview.getStarted.steps.${step.key}.title`) }}
            </p>
            <p v-if="!step.done" class="text-xs text-muted-foreground">
              {{ t(`overview.getStarted.steps.${step.key}.description`) }}
            </p>
          </div>

          <ArrowRight
            v-if="!step.done"
            class="size-4 shrink-0 -translate-x-1 text-muted-foreground/50 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
          />
        </NuxtLink>
      </div>
    </section>

    <!-- Populated dashboard -->
    <template v-else>
      <!-- Stat strip -->
      <section
        class="flex flex-wrap items-stretch gap-x-10 gap-y-4 rounded-xl border border-border/60 px-6 py-4"
      >
        <NuxtLink
          v-for="stat in stats"
          :key="stat.label"
          :to="stat.href"
          class="flex flex-col gap-0.5 transition-opacity hover:opacity-70"
        >
          <span class="text-2xl font-semibold tracking-tight text-foreground">
            {{ stat.value }}
          </span>
          <span class="text-xs text-muted-foreground">{{ stat.label }}</span>
        </NuxtLink>
      </section>

      <!-- Recent activity + recent files -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Recent activity -->
        <section>
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-medium text-foreground">
              {{ t("overview.sections.recentActivity") }}
            </h3>
          </div>
          <div
            v-if="activities?.length"
            class="divide-y divide-border/50 rounded-xl border border-border/60"
          >
            <div
              v-for="activity in activities"
              :key="activity.id"
              class="flex items-start gap-3 px-4 py-3"
            >
              <div
                class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground"
              >
                <component
                  :is="activityIcon(activity.activityType)"
                  :size="14"
                  :stroke-width="1.75"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm text-foreground">
                  {{ activity.description }}
                </p>
                <p class="mt-0.5 text-xs text-muted-foreground">
                  {{ activity.performedBy.displayName ?? activity.performedBy.username }}
                  · {{ relativeTime(activity.createdAt) }}
                </p>
              </div>
            </div>
          </div>
          <div
            v-else
            class="flex items-center justify-center rounded-xl border border-dashed border-border/60 px-4 py-10 text-sm text-muted-foreground"
          >
            {{ t("overview.sections.empty.activity") }}
          </div>
        </section>

        <!-- Recent files -->
        <section>
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-medium text-foreground">
              {{ t("overview.sections.recentFiles") }}
            </h3>
            <NuxtLink
              v-if="recentFiles.length"
              :to="wLink('/files')"
              class="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {{ t("overview.sections.viewAll") }}
            </NuxtLink>
          </div>
          <div
            v-if="recentFiles.length"
            class="divide-y divide-border/50 rounded-xl border border-border/60"
          >
            <NuxtLink
              v-for="file in recentFiles"
              :key="file.id"
              :to="wLink('/files')"
              class="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <div
                class="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground"
              >
                <component
                  :is="getFileIcon(file.displayName)"
                  :size="14"
                  :stroke-width="1.75"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-foreground">
                  {{ file.displayName }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ formatFileSize(file.fileSize) }} ·
                  {{ relativeTime(file.createdAt) }}
                </p>
              </div>
            </NuxtLink>
          </div>
          <div
            v-else
            class="flex items-center justify-center rounded-xl border border-dashed border-border/60 px-4 py-10 text-sm text-muted-foreground"
          >
            {{ t("overview.sections.empty.files") }}
          </div>
        </section>
      </div>
    </template>

    <!-- Quick actions -->
    <div>
      <h3
        class="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {{ t("overview.quickActions.title") }}
      </h3>
      <div class="grid gap-3 sm:grid-cols-3">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.title"
          :to="action.href"
          class="group flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:border-border hover:bg-muted/30"
        >
          <div
            class="rounded-md bg-muted/50 p-2 transition-colors group-hover:bg-muted"
          >
            <component :is="action.icon" class="size-4 text-muted-foreground" />
          </div>
          <p class="flex-1 text-sm font-medium text-foreground">
            {{ action.title }}
          </p>
          <ArrowRight
            class="size-4 -translate-x-2 text-muted-foreground/50 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
          />
        </NuxtLink>
      </div>

      <p v-if="createdOn" class="mt-6 text-xs text-muted-foreground/70">
        {{ t("overview.workspace.created") }} · {{ createdOn }}
      </p>
    </div>
  </div>
</template>
