<script setup lang="ts">
import {
	ArrowRight,
	Check,
	CircleSlash,
	ClipboardCheck,
	Clock,
	FileText,
	Link2,
	Loader2,
	Mail,
	Play,
	Settings2,
	ShieldCheck,
	Upload,
	Users,
	Webhook as WebhookIcon,
	X,
} from "@lucide/vue";
import type { PipelineRunStatus } from "@nvisy/sdk/datatypes";
import { useLocalStorage } from "@vueuse/core";
import type { Component } from "vue";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import { EntityAvatar } from "#console/components/common";
import { personLabel } from "#console/utils/naming";
import { getFileIcon } from "#console/utils/file";
import { activityContent } from "#console/utils/activities";
import OverviewStats from "./OverviewStats.vue";

const { t } = useI18n();
const { wLink } = useWorkspaceLink();
const { relativeTime } = useRelativeTime();
const { resolveAvatarUrl } = useAvatarUrl();
const { currentWorkspace } = useWorkspaces();
const { members } = useMembers();
const { files } = useFiles();
const { policies } = usePolicies();
const { activities } = useActivities({ pageSize: 8 });
const { runs } = useRuns();

// --- Setup progress -----------------------------------------------------
// Each step's `done` flag is derived from real data. While setup is incomplete
// (and not dismissed) a "Set up your workspace" card sits among the dashboard
// cards; it disappears once every step is done or the user hides it.
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
		href: wLink("/policies?create=1"),
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

// Let users hide the setup card. Persisted per-workspace in localStorage so it
// stays hidden across reloads.
const dismissedSlugs = useLocalStorage<string[]>(
	"overview-setup-dismissed",
	[],
);
const isDismissed = computed(() =>
	currentWorkspace.value
		? dismissedSlugs.value.includes(currentWorkspace.value.slug)
		: false,
);
function dismissSetup(): void {
	const slug = currentWorkspace.value?.slug;
	if (slug && !dismissedSlugs.value.includes(slug)) {
		dismissedSlugs.value = [...dismissedSlugs.value, slug];
	}
}

// The setup card shows while setup is unfinished and hasn't been hidden. The
// live dashboard (activity / files / runs) always renders alongside it.
const showSetupCard = computed(() => !allSetUp.value && !isDismissed.value);

// --- Recent activity ----------------------------------------------------
// Each activity carries a typed, optional payload; the client localizes it via
// `activityContent`. Map the resulting category to an icon here.
const ACTIVITY_ICON: Record<string, Component> = {
	workspace: Settings2,
	member: Users,
	invite: Mail,
	connection: Link2,
	webhook: WebhookIcon,
	file: FileText,
	pipeline: Play,
	policy: ShieldCheck,
};
function activityIcon(category: string): Component {
	return ACTIVITY_ICON[category] ?? Settings2;
}

// View-models for the recent-activity list. Activities whose payload didn't
// decode (undefined) carry no localizable copy, so we drop them.
const recentActivities = computed(() =>
	(activities.value ?? []).flatMap((activity) => {
		if (!activity.payload) return [];
		const c = activityContent(activity.payload);
		return [
			{
				id: activity.id,
				icon: activityIcon(c.category),
				text: t(c.messageKey, c.params),
				performedBy: activity.performedBy,
				createdAt: activity.createdAt,
			},
		];
	}),
);

const recentFiles = computed(() => (files.value ?? []).slice(0, 5));

// --- Recent runs --------------------------------------------------------
// Most-recent pipeline runs, newest first. A run is shown by the document it
// analyzes (mirroring the Recent files card): a file-icon tile carrying a
// small status badge in its corner, the pipeline as secondary detail, and the
// account that triggered it.
const recentRuns = computed(() =>
	[...(runs.value ?? [])]
		.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
		.slice(0, 5)
		.map((run) => ({
			id: run.id,
			status: run.status,
			pipelineSlug: run.pipelineSlug,
			startedAt: run.startedAt,
			triggeredBy: run.triggeredBy,
			// The source document; fall back to the id when the name is absent.
			fileName: run.inputFileName || run.inputFileId,
		})),
);

// Corner status glyph on the file tile. Restrained color: failure is
// destructive, a completed run reads as foreground, everything in-between
// stays muted (no rainbow) in keeping with the monochrome system.
const RUN_STATUS_ICON: Record<
	PipelineRunStatus,
	{ icon: Component; class: string; spin?: boolean }
> = {
	queued: { icon: Clock, class: "text-muted-foreground" },
	analyzing: { icon: Loader2, class: "text-muted-foreground", spin: true },
	analyzed: { icon: ClipboardCheck, class: "text-muted-foreground" },
	completed: { icon: Check, class: "text-foreground" },
	failed: { icon: X, class: "text-destructive" },
	cancelled: { icon: CircleSlash, class: "text-muted-foreground" },
};

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
		title: t("overview.quickActions.policies.title"),
		icon: ShieldCheck,
		href: wLink("/policies"),
	},
];
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8">
    <!-- Workspace stat totals (runs, storage). -->
    <OverviewStats />

    <!-- Top row: recent activity, plus the setup card while unfinished. -->
    <div class="grid gap-6" :class="showSetupCard ? 'lg:grid-cols-2' : ''">
      <!-- Recent activity -->
      <Card class="rounded-xl border-border/50 py-0 pt-6">
        <CardHeader>
          <div class="flex items-start justify-between">
            <CardTitle
              class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {{ t("overview.sections.recentActivity") }}
            </CardTitle>
            <NuxtLink
              v-if="recentActivities.length"
              :to="wLink('/analytics/logs')"
              class="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {{ t("overview.sections.viewAll") }}
            </NuxtLink>
          </div>
        </CardHeader>
        <CardContent class="pb-6">
          <div v-if="recentActivities.length" class="-my-1 flex flex-col">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex min-h-14 items-center gap-3 py-2.5"
            >
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-muted-foreground"
              >
                <component
                  :is="activity.icon"
                  :size="16"
                  :stroke-width="1.75"
                />
              </div>
              <p class="min-w-0 flex-1 truncate text-sm text-foreground">
                {{ activity.text }}
              </p>
              <div class="flex min-w-0 shrink items-center gap-2">
                <EntityAvatar
                  size="sm"
                  class="shrink-0"
                  :name="personLabel(activity.performedBy)"
                  :src="resolveAvatarUrl(activity.performedBy.avatarUrl)"
                />
                <span class="truncate text-sm text-muted-foreground">
                  {{ personLabel(activity.performedBy) }}
                </span>
              </div>
              <span class="shrink-0 text-xs text-muted-foreground">
                {{ relativeTime(activity.createdAt) }}
              </span>
            </div>
          </div>
          <div v-else class="py-10 text-center">
            <div
              class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
            >
              <Settings2 class="size-5 text-muted-foreground" />
            </div>
            <p class="mb-1 text-sm text-foreground">
              {{ t("overview.sections.empty.activity") }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ t("overview.sections.empty.activityDescription") }}
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Set up your workspace (dismissible, while unfinished) -->
      <Card v-if="showSetupCard" class="rounded-xl border-border/50 py-0 pt-6">
        <CardHeader>
          <div class="flex items-start justify-between gap-2">
            <div>
              <CardTitle
                class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                {{ t("overview.getStarted.title") }}
              </CardTitle>
              <CardDescription class="mt-1 text-sm">
                {{ t("overview.getStarted.cardSubtitle") }}
              </CardDescription>
            </div>
            <button
              type="button"
              class="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-foreground"
              :aria-label="t('overview.getStarted.skip')"
              @click="dismissSetup"
            >
              <X :size="16" />
            </button>
          </div>
        </CardHeader>
        <CardContent class="pb-6">
          <div class="-my-1 flex flex-col">
            <NuxtLink
              v-for="(step, i) in setupSteps"
              :key="step.key"
              :to="step.href"
              class="group flex items-center gap-3 py-2.5"
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
                <component
                  :is="step.icon"
                  v-else
                  :size="14"
                  :stroke-width="1.75"
                />
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
        </CardContent>
      </Card>
    </div>

    <!-- Recent files + recent runs -->
    <div class="grid gap-6 lg:grid-cols-2">
        <!-- Recent files -->
        <Card class="rounded-xl border-border/50 py-0 pt-6">
          <CardHeader>
            <div class="flex items-start justify-between">
              <CardTitle
                class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                {{ t("overview.sections.recentFiles") }}
              </CardTitle>
              <NuxtLink
                v-if="recentFiles.length"
                :to="wLink('/files')"
                class="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {{ t("overview.sections.viewAll") }}
              </NuxtLink>
            </div>
          </CardHeader>
          <CardContent class="pb-6">
            <div v-if="recentFiles.length" class="-my-1 flex flex-col">
              <NuxtLink
                v-for="file in recentFiles"
                :key="file.id"
                :to="wLink('/files')"
                class="group flex min-h-14 items-center gap-3 py-2.5"
              >
                <div
                  class="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-muted-foreground"
                >
                  <component
                    :is="getFileIcon(file.displayName)"
                    :size="16"
                    :stroke-width="1.75"
                  />
                </div>
                <p class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {{ file.displayName }}
                </p>
                <div class="flex min-w-0 shrink items-center gap-2">
                  <EntityAvatar
                    size="sm"
                    class="shrink-0"
                    :name="personLabel(file.uploadedBy)"
                    :src="resolveAvatarUrl(file.uploadedBy.avatarUrl)"
                  />
                  <span class="truncate text-sm text-muted-foreground">
                    {{ personLabel(file.uploadedBy) }}
                  </span>
                </div>
                <span class="shrink-0 text-xs text-muted-foreground">
                  {{ relativeTime(file.createdAt) }}
                </span>
              </NuxtLink>
            </div>
            <div v-else class="py-10 text-center">
              <div
                class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
              >
                <FileText class="size-5 text-muted-foreground" />
              </div>
              <p class="mb-1 text-sm text-foreground">
                {{ t("overview.sections.empty.files") }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ t("overview.sections.empty.filesDescription") }}
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Recent runs -->
        <Card class="rounded-xl border-border/50 py-0 pt-6">
          <CardHeader>
            <div class="flex items-start justify-between">
              <CardTitle
                class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                {{ t("overview.sections.recentRuns") }}
              </CardTitle>
              <NuxtLink
                v-if="recentRuns.length"
                :to="wLink('/workflows/runs')"
                class="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {{ t("overview.sections.viewAll") }}
              </NuxtLink>
            </div>
          </CardHeader>
          <CardContent class="pb-6">
            <div v-if="recentRuns.length" class="-my-1 flex flex-col">
              <NuxtLink
                v-for="run in recentRuns"
                :key="run.id"
                :to="wLink('/workflows/runs')"
                class="flex min-h-14 items-center gap-3 py-2.5"
              >
                <div class="relative shrink-0">
                  <div
                    class="flex size-8 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-muted-foreground"
                  >
                    <component
                      :is="getFileIcon(run.fileName)"
                      :size="16"
                      :stroke-width="1.75"
                    />
                  </div>
                  <span
                    :title="t(`workflows.runs.runStatus.${run.status}`)"
                    class="absolute -bottom-1 -right-1 flex size-[18px] items-center justify-center rounded-full border border-border bg-background ring-2 ring-background"
                  >
                    <component
                      :is="RUN_STATUS_ICON[run.status].icon"
                      :size="11"
                      :stroke-width="2.5"
                      :class="[
                        RUN_STATUS_ICON[run.status].class,
                        RUN_STATUS_ICON[run.status].spin && 'animate-spin',
                      ]"
                    />
                  </span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-foreground">
                    {{ run.fileName }}
                  </p>
                  <p class="truncate font-mono text-xs text-muted-foreground">
                    {{ run.pipelineSlug }}
                  </p>
                </div>
                <div class="flex min-w-0 shrink items-center gap-2">
                  <EntityAvatar
                    size="sm"
                    class="shrink-0"
                    :name="personLabel(run.triggeredBy)"
                    :src="resolveAvatarUrl(run.triggeredBy.avatarUrl)"
                  />
                  <span class="truncate text-sm text-muted-foreground">
                    {{ personLabel(run.triggeredBy) }}
                  </span>
                </div>
                <span class="shrink-0 text-xs text-muted-foreground">
                  {{ relativeTime(run.startedAt) }}
                </span>
              </NuxtLink>
            </div>
            <div v-else class="py-10 text-center">
              <div
                class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
              >
                <Play class="size-5 text-muted-foreground" />
              </div>
              <p class="mb-1 text-sm text-foreground">
                {{ t("overview.sections.empty.runs") }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ t("overview.sections.empty.runsDescription") }}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  </div>
</template>
