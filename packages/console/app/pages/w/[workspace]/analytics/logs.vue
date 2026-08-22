<script setup lang="ts">
import type { Component, Ref } from "vue";
import type { ActivityType } from "@nvisy/sdk/datatypes";
import type { ActivityFilters } from "#console/composables/useActivities";
import type { VirtualColumn } from "#console/components/ui/virtual-table";
import {
	Calendar,
	Download,
	FileText,
	History,
	Link2,
	Mail,
	Play,
	Settings2,
	ShieldCheck,
	Users,
	Webhook as WebhookIcon,
} from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { personLabel } from "#console/utils/naming";
import { activityContent } from "#console/utils/activities";
import { VirtualTable } from "#console/components/ui/virtual-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#console/components/ui/popover";
import { RangeCalendar } from "#console/components/ui/range-calendar";
import type { DateRange } from "reka-ui";
import { toast } from "vue-sonner";
import LogsExportModal from "#console/components/pages/analytics/LogsExportModal.vue";
import { HeaderSocket, SectionTabs } from "#console/components/layout/header";

const { t } = useI18n();
const sectionTabs = useSectionTabs();
const { relativeTime } = useRelativeTime();
const { resolveAvatarUrl } = useAvatarUrl();

useHead({ title: "Logs" });

definePageMeta({
	pageCategory: "header.category.analytics",
	hideCategory: true,
});

// ── Filters (server-side, via listActivities) ──────────────────────────────
// Category maps to the set of activity `type`s the server filters on; a date
// range narrows the window. Both are sent to the API — no client-side filtering.
const category = ref<string>("all");
const dateRange = ref<{ from?: string; to?: string }>({});

const CATEGORY_ICON: Record<string, Component> = {
	workspace: Settings2,
	member: Users,
	invite: Mail,
	connection: Link2,
	webhook: WebhookIcon,
	file: FileText,
	pipeline: Play,
	policy: ShieldCheck,
};
// Category -> the activity types under it (the server's `type` filter). Keys
// mirror the `category` segment of each `ActivityType`.
const CATEGORY_TYPES = {
	workspace: ["workspace.created", "workspace.updated", "workspace.deleted"],
	member: ["member.added", "member.updated", "member.deleted"],
	invite: [
		"invite.created",
		"invite.accepted",
		"invite.declined",
		"invite.canceled",
	],
	connection: [
		"connection.created",
		"connection.updated",
		"connection.deleted",
		"connection.sync.started",
		"connection.sync.completed",
		"connection.sync.failed",
	],
	webhook: ["webhook.created", "webhook.updated", "webhook.deleted"],
	file: ["file.created", "file.updated", "file.deleted"],
	pipeline: [
		"pipeline.created",
		"pipeline.updated",
		"pipeline.deleted",
		"pipeline.run.started",
		"pipeline.run.analyzed",
		"pipeline.run.completed",
		"pipeline.run.failed",
	],
	policy: ["policy.created", "policy.updated", "policy.deleted"],
} as const satisfies Record<string, ActivityType[]>;
const CATEGORIES = Object.keys(
	CATEGORY_TYPES,
) as (keyof typeof CATEGORY_TYPES)[];

function activityIcon(category: string): Component {
	return CATEGORY_ICON[category] ?? Settings2;
}

const filters = computed<ActivityFilters>(() => ({
	type:
		category.value === "all"
			? undefined
			: [...CATEGORY_TYPES[category.value as keyof typeof CATEGORY_TYPES]],
	from: dateRange.value.from,
	to: dateRange.value.to,
}));

// Date-range picker. The RangeCalendar works in `DateValue`; we mirror its
// selection into `dateRange` as ISO `YYYY-MM-DD` (what the API filter wants).
// `CalendarDate.toString()` is already ISO.
const isCalendarOpen = ref(false);
// Cast as `DateRange` — reka-ui's range type and @internationalized/date's
// DateValue don't unify structurally (same as the export modal).
const calendarRange = ref({
	start: undefined,
	end: undefined,
}) as Ref<DateRange>;
watch(calendarRange, (range) => {
	dateRange.value = {
		from: range.start?.toString(),
		to: range.end?.toString(),
	};
});

const rangeLabel = computed(() => {
	const { from, to } = dateRange.value;
	if (!from || !to) return t("analytics.logs.filters.anyDate");
	return `${formatLongDate(from)} – ${formatLongDate(to)}`;
});

function clearDateRange() {
	calendarRange.value = { start: undefined, end: undefined };
	dateRange.value = {};
}

const { activities, loadMore, exportActivities } = useActivities({
	pageSize: 50,
	filters,
});

// View-models: localize each activity's copy and category up front. Activities
// whose payload didn't decode (undefined) carry no localizable copy, so we drop
// them from the table.
const activityRows = computed(() =>
	(activities.value ?? []).flatMap((activity) => {
		if (!activity.payload) return [];
		const c = activityContent(activity.payload);
		return [
			{
				id: activity.id,
				category: c.category,
				icon: activityIcon(c.category),
				text: t(c.messageKey, c.params),
				performedBy: activity.performedBy,
				createdAt: activity.createdAt,
			},
		];
	}),
);
type ActivityRow = (typeof activityRows.value)[number];

// Columns for the shared VirtualTable (matching the files table's look): a
// muted relative time, the event as an icon+label, the localized message, and
// the actor's avatar.
const columns = computed<VirtualColumn<ActivityRow>[]>(() => [
	{
		key: "time",
		header: t("analytics.logs.table.time"),
		width: "150px",
		cell: (row) => ({
			type: "text",
			value: relativeTime(row.createdAt),
			muted: true,
		}),
	},
	{
		key: "type",
		header: t("analytics.logs.table.type"),
		width: "170px",
		cell: (row) => ({
			type: "status",
			icon: row.icon,
			iconClass: "text-muted-foreground",
			label: t(`activities.category.${row.category}`),
		}),
	},
	{
		key: "message",
		header: t("analytics.logs.table.message"),
		cell: (row) => ({ type: "text", value: row.text }),
	},
	{
		key: "by",
		header: t("analytics.logs.table.by"),
		width: "220px",
		cell: (row) => ({
			type: "avatar",
			name: personLabel(row.performedBy),
			src: resolveAvatarUrl(row.performedBy.avatarUrl),
		}),
	},
]);

// Export: a date-range + format modal that downloads the activity log via the
// SDK's exportActivities endpoint.
const isExportModalOpen = ref(false);
const isExporting = ref(false);

async function handleExport(options: {
	format: "csv" | "json";
	from?: string;
	to?: string;
}) {
	isExporting.value = true;
	try {
		const fileName = `activity-log.${options.format}`;
		await exportActivities(fileName, options);
		isExportModalOpen.value = false;
	} catch (err) {
		toast.error(getErrorMessage(err, t("analytics.logs.exportDialog.failed")));
	} finally {
		isExporting.value = false;
	}
}
</script>

<template>
  <!-- Fixed-height page so the virtual table fills and scrolls (like /files). -->
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6 h-[calc(100vh-5.5rem)]">
    <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 min-h-0">
      <!-- Section tabs in the app-header socket. -->
      <HeaderSocket>
        <SectionTabs :tabs="sectionTabs.analytics.value" />
      </HeaderSocket>

      <!-- Filters on the left, export on the right. -->
      <div class="flex flex-wrap items-center gap-3">
        <Select v-model="category">
          <SelectTrigger class="h-9 w-[170px]">
            <SelectValue :placeholder="t('analytics.logs.category.placeholder')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {{ t("analytics.logs.category.all") }}
            </SelectItem>
            <SelectItem v-for="c in CATEGORIES" :key="c" :value="c">
              {{ t(`activities.category.${c}`) }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Popover v-model:open="isCalendarOpen">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              class="h-9 justify-start text-left font-normal"
            >
              <Calendar :size="16" class="mr-2 text-muted-foreground" />
              {{ rangeLabel }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <RangeCalendar v-model="calendarRange" />
          </PopoverContent>
        </Popover>

        <Button
          v-if="dateRange.from || dateRange.to"
          variant="ghost"
          size="sm"
          class="h-9"
          @click="clearDateRange"
        >
          {{ t("analytics.logs.filters.clearDates") }}
        </Button>

        <div class="ml-auto">
          <Button variant="outline" size="sm" @click="isExportModalOpen = true">
            <Download :size="16" class="mr-2" />
            {{ t("analytics.logs.export") }}
          </Button>
        </div>
      </div>

      <!-- Activity table (shared VirtualTable, matching the files table). -->
      <div class="relative min-h-0 flex-1">
        <VirtualTable
          :rows="activityRows"
          :columns="columns"
          :empty="{
            icon: History,
            title: t('analytics.logs.empty'),
            description: t('analytics.logs.emptyDescription'),
          }"
          @load-more="loadMore"
        />
      </div>

      <LogsExportModal
        :open="isExportModalOpen"
        :is-exporting="isExporting"
        @update:open="isExportModalOpen = $event"
        @export="handleExport"
      />
    </div>
  </div>
</template>
