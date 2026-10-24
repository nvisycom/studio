<script setup lang="ts">
import {
	ArrowRight,
	Check,
	CircleSlash,
	ClipboardCheck,
	Clock,
	EyeOff,
	FileText,
	Link2,
	Loader2,
	Mail,
	Play,
	ScanSearch,
	Settings2,
	ShieldCheck,
	Upload,
	Users,
	Webhook as WebhookIcon,
	X,
} from "@lucide/vue";
import type { DetectionStatus } from "@nvisy/sdk/datatypes";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import { EntityAvatar } from "#console/components/avatar";
import { ActivityIcon } from "#console/components/shared";
import { personLabel } from "#console/utils/naming";
import { getFileIcon, getFileIconForExtension } from "#console/utils/file";
import { activityContent } from "#console/utils/activities";
import OverviewStats from "./OverviewStats.vue";

const { t } = useI18n();
const { wLink } = useWorkspaceLink();
const { relativeTime } = useRelativeTime();
const { resolveAvatarUrl } = useAvatarUrl();
const { documents } = useDocuments();
const { activities } = useActivities({ pageSize: 8 });
const { detections } = useDetections();

// Each activity carries a typed, optional payload; the client localizes it via
// `activityContent`. Map the resulting category to an icon here.
const ACTIVITY_ICON: Record<string, Component> = {
	workspace: Settings2,
	member: Users,
	invite: Mail,
	connection: Link2,
	webhook: WebhookIcon,
	file: FileText,
	detection: ScanSearch,
	redaction: EyeOff,
	policy: ShieldCheck,
};
function activityIcon(category: string): Component {
	return ACTIVITY_ICON[category] ?? Settings2;
}

// View-models for the recent-activity list. Activities whose payload didn't
// decode (undefined) carry no localizable copy, so we drop them.
// Cap at 5 like the recent files/detections cards. We fetch a few extra (pageSize: 8)
// so undecoded payloads (dropped below) still leave enough to fill 5.
const recentActivities = computed(() =>
	(activities.value ?? [])
		.flatMap((activity) => {
			if (!activity.payload) return [];
			const c = activityContent(activity.payload);
			return [
				{
					id: activity.id,
					icon: activityIcon(c.category),
					action: c.action,
					text: t(c.messageKey, c.params),
					performedBy: activity.performedBy,
					createdAt: activity.createdAt,
				},
			];
		})
		.slice(0, 5),
);

const recentDocuments = computed(() => (documents.value ?? []).slice(0, 5));

// Most-recent detections, newest first. Each is shown by the document
// it analyzes (mirroring the Recent files card): a file-icon tile carrying a
// small status badge in its corner, when it ran as secondary detail, and the
// account that triggered it.
const recentDetections = computed(() =>
	[...(detections.value ?? [])]
		.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
		.slice(0, 5)
		.map((detection) => ({
			id: detection.id,
			status: detection.status,
			startedAt: detection.startedAt,
			triggeredBy: detection.triggeredBy,
			// The source document; fall back to the id when the name is absent.
			fileName: detection.inputDocumentName || detection.inputDocumentId,
		})),
);

// Corner status glyph on the file tile. Restrained color: failure is
// destructive, a complete detection reads as foreground, everything in-between
// stays muted (no rainbow) in keeping with the monochrome system.
const DETECTION_STATUS_ICON: Record<
	DetectionStatus,
	{ icon: Component; class: string; spin?: boolean }
> = {
	pending: { icon: Clock, class: "text-muted-foreground" },
	executing: { icon: Loader2, class: "text-muted-foreground", spin: true },
	complete: { icon: Check, class: "text-foreground" },
	failed: { icon: X, class: "text-destructive" },
};

// Quick actions (always available)
const quickActions = [
	{
		title: t("overview.quickActions.uploadFiles.title"),
		icon: Upload,
		href: wLink("/documents"),
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
    <!-- Workspace stat totals (detections, storage). -->
    <OverviewStats />

    <!-- Recent activity -->
    <div class="grid gap-6">
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
              <ActivityIcon :icon="activity.icon" :action="activity.action" />
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
              <span class="w-16 shrink-0 whitespace-nowrap text-right text-xs text-muted-foreground">
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

    </div>

    <!-- Recent files + recent detections -->
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
                v-if="recentDocuments.length"
                :to="wLink('/documents')"
                class="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {{ t("overview.sections.viewAll") }}
              </NuxtLink>
            </div>
          </CardHeader>
          <CardContent class="pb-6">
            <div v-if="recentDocuments.length" class="-my-1 flex flex-col">
              <NuxtLink
                v-for="file in recentDocuments"
                :key="file.id"
                :to="wLink('/documents')"
                class="group flex min-h-14 items-center gap-3 py-2.5"
              >
                <div
                  class="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-muted-foreground"
                >
                  <component
                    :is="getFileIconForExtension(file.extension)"
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
                <span class="w-16 shrink-0 whitespace-nowrap text-right text-xs text-muted-foreground">
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

        <!-- Recent detections -->
        <Card class="rounded-xl border-border/50 py-0 pt-6">
          <CardHeader>
            <div class="flex items-start justify-between">
              <CardTitle
                class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                {{ t("overview.sections.recentDetections") }}
              </CardTitle>
              <NuxtLink
                v-if="recentDetections.length"
                :to="wLink('/detections')"
                class="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {{ t("overview.sections.viewAll") }}
              </NuxtLink>
            </div>
          </CardHeader>
          <CardContent class="pb-6">
            <div v-if="recentDetections.length" class="-my-1 flex flex-col">
              <NuxtLink
                v-for="detection in recentDetections"
                :key="detection.id"
                :to="wLink('/detections')"
                class="flex min-h-14 items-center gap-3 py-2.5"
              >
                <div class="relative shrink-0">
                  <div
                    class="flex size-8 items-center justify-center rounded-md border border-border/60 bg-muted/40 text-muted-foreground"
                  >
                    <component
                      :is="getFileIcon(detection.fileName)"
                      :size="16"
                      :stroke-width="1.75"
                    />
                  </div>
                  <span
                    :title="t(`detections.detectionStatus.${detection.status}`)"
                    class="absolute -bottom-1 -right-1 flex size-[18px] items-center justify-center rounded-full border border-border bg-background ring-2 ring-background"
                  >
                    <component
                      :is="DETECTION_STATUS_ICON[detection.status].icon"
                      :size="11"
                      :stroke-width="2.5"
                      :class="[
                        DETECTION_STATUS_ICON[detection.status].class,
                        DETECTION_STATUS_ICON[detection.status].spin && 'animate-spin',
                      ]"
                    />
                  </span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-foreground">
                    {{ detection.fileName }}
                  </p>
                  <p class="truncate text-xs text-muted-foreground">
                    {{ relativeTime(detection.startedAt) }}
                  </p>
                </div>
                <div class="flex min-w-0 shrink items-center gap-2">
                  <EntityAvatar
                    size="sm"
                    class="shrink-0"
                    :name="personLabel(detection.triggeredBy)"
                    :src="resolveAvatarUrl(detection.triggeredBy.avatarUrl)"
                  />
                  <span class="truncate text-sm text-muted-foreground">
                    {{ personLabel(detection.triggeredBy) }}
                  </span>
                </div>
                <!-- Fixed width + right-aligned so a shorter time ("3h ago")
                     doesn't let the avatar/name drift right of a longer one. -->
                <span class="w-16 shrink-0 whitespace-nowrap text-right text-xs text-muted-foreground">
                  {{ relativeTime(detection.startedAt) }}
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
                {{ t("overview.sections.empty.detections") }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ t("overview.sections.empty.detectionsDescription") }}
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
