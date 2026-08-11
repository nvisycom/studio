<script setup lang="ts">
import type { DateRange } from "reka-ui";
import type { Ref } from "vue";
import type { ActivityType } from "@nvisy/sdk/datatypes";
import type { Component } from "vue";
import { getLocalTimeZone, today } from "@internationalized/date";
import {
	Download,
	Upload,
	Search,
	Calendar,
	FileText,
	History,
	Link2,
	Loader2,
	Mail,
	Settings2,
	Users,
	Webhook as WebhookIcon,
} from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Badge } from "#console/components/ui/badge";
import { EntityAvatar } from "#console/components/common";
import { personLabel } from "#console/utils/naming";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#console/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import { Input } from "#console/components/ui/input";
import { Checkbox } from "#console/components/ui/checkbox";
import { Label } from "#console/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import { RangeCalendar } from "#console/components/ui/range-calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#console/components/ui/popover";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();
const { resolveAvatarUrl } = useAvatarUrl();
const { activities, isLoading, hasMore, loadMore, isLoadingMore } =
	useActivities({ pageSize: 50 });

useHead({ title: "Logs" });

definePageMeta({
	pageCategory: "header.category.analytics",
});

// Filters (client-side: the activities API paginates but doesn't search/filter).
const searchQuery = ref("");
const category = ref("all");

// Activity category -> icon. `activityType` is `<category>:<action>`.
const CATEGORY_ICON: Record<string, Component> = {
	workspace: Settings2,
	member: Users,
	invite: Mail,
	connection: Link2,
	webhook: WebhookIcon,
	file: FileText,
};
const CATEGORIES = [
	"workspace",
	"member",
	"invite",
	"connection",
	"webhook",
	"file",
] as const;
function activityCategory(type: ActivityType): string {
	return type.split(":")[0] ?? "";
}
function activityIcon(type: ActivityType): Component {
	return CATEGORY_ICON[activityCategory(type)] ?? Settings2;
}

const filteredActivities = computed(() => {
	let list = activities.value ?? [];
	if (category.value !== "all") {
		list = list.filter(
			(a) => activityCategory(a.activityType) === category.value,
		);
	}
	if (searchQuery.value.trim()) {
		const q = searchQuery.value.toLowerCase();
		list = list.filter(
			(a) =>
				a.description.toLowerCase().includes(q) ||
				a.activityType.toLowerCase().includes(q),
		);
	}
	return list;
});

// Export/Import stubs (unchanged — still TODO).
const isOnPremise = ref(false);
const isExportModalOpen = ref(false);
const start = today(getLocalTimeZone());
const end = start.add({ days: 7 });
const exportDateRange = ref({ start, end }) as Ref<DateRange>;
const isCalendarOpen = ref(false);
const exportEventTypes = ref({ info: true, warning: true, error: true });

const formattedExportDateRange = computed(() => {
	if (!exportDateRange.value.start || !exportDateRange.value.end) {
		return t("analytics.logs.exportDialog.selectDateRange");
	}
	const startDate = new Date(
		exportDateRange.value.start.year,
		exportDateRange.value.start.month - 1,
		exportDateRange.value.start.day,
	);
	const endDate = new Date(
		exportDateRange.value.end.year,
		exportDateRange.value.end.month - 1,
		exportDateRange.value.end.day,
	);
	return `${formatLongDate(startDate)} - ${formatLongDate(endDate)}`;
});

function openExportModal() {
	isExportModalOpen.value = true;
}
function handleExport(_format: "csv" | "json") {
	// TODO: Implement actual export functionality
	isExportModalOpen.value = false;
}
function importLogs() {
	// TODO: Implement actual import functionality
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-0">
    <div class="w-full">
      <!-- Search and filters -->
      <div class="mb-6 flex flex-wrap items-center gap-4">
        <div class="min-w-[200px] flex-1">
          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-model="searchQuery"
              :placeholder="t('analytics.logs.searchPlaceholder')"
              class="h-9 pl-10"
            />
          </div>
        </div>

        <Select v-model="category">
          <SelectTrigger class="h-9 w-[170px]">
            <SelectValue :placeholder="t('analytics.logs.category.placeholder')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {{ t("analytics.logs.category.all") }}
            </SelectItem>
            <SelectItem v-for="c in CATEGORIES" :key="c" :value="c">
              {{ t(`analytics.logs.category.${c}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Activity table -->
      <Card class="rounded-xl border-border/50 py-0 pb-6 pt-6">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="text-sm font-medium">
                {{ t("analytics.logs.title") }}
              </CardTitle>
              <CardDescription class="text-xs text-muted-foreground">
                {{ t("analytics.logs.count", filteredActivities.length) }}
              </CardDescription>
            </div>
            <div class="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="!isOnPremise"
                @click="importLogs"
              >
                <Upload :size="16" class="mr-2" />
                {{ t("analytics.logs.import") }}
              </Button>
              <Button variant="outline" size="sm" @click="openExportModal">
                <Download :size="16" class="mr-2" />
                {{ t("analytics.logs.export") }}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <!-- Loading -->
          <div v-if="isLoading" class="flex items-center justify-center py-12">
            <Loader2 :size="24" class="animate-spin text-muted-foreground" />
          </div>

          <!-- Empty -->
          <div
            v-else-if="filteredActivities.length === 0"
            class="py-12"
          >
            <div class="text-center">
              <div
                class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
              >
                <History class="size-5 text-muted-foreground" />
              </div>
              <p class="mb-1 text-sm text-foreground">
                {{ t("analytics.logs.empty") }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ t("analytics.logs.emptyDescription") }}
              </p>
            </div>
          </div>

          <template v-else>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-[140px]">
                    {{ t("analytics.logs.table.time") }}
                  </TableHead>
                  <TableHead class="w-[150px]">
                    {{ t("analytics.logs.table.type") }}
                  </TableHead>
                  <TableHead>{{ t("analytics.logs.table.message") }}</TableHead>
                  <TableHead class="w-[200px]">
                    {{ t("analytics.logs.table.by") }}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="activity in filteredActivities"
                  :key="activity.id"
                >
                  <TableCell class="text-xs text-muted-foreground">
                    {{ relativeTime(activity.createdAt) }}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      class="gap-1.5 font-normal capitalize"
                    >
                      <component
                        :is="activityIcon(activity.activityType)"
                        :size="12"
                        :stroke-width="1.75"
                      />
                      {{ t(`analytics.logs.category.${activityCategory(activity.activityType)}`) }}
                    </Badge>
                  </TableCell>
                  <TableCell class="max-w-md truncate text-sm text-foreground">
                    {{ activity.description }}
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <EntityAvatar
                        size="sm"
                        :name="personLabel(activity.performedBy)"
                        :src="resolveAvatarUrl(activity.performedBy.avatarUrl)"
                      />
                      <span class="truncate text-sm text-muted-foreground">
                        {{ personLabel(activity.performedBy) }}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <!-- Load more -->
            <div v-if="hasMore" class="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                :disabled="isLoadingMore"
                @click="loadMore"
              >
                <Loader2
                  v-if="isLoadingMore"
                  :size="16"
                  class="mr-2 animate-spin"
                />
                {{ t("analytics.logs.loadMore") }}
              </Button>
            </div>
          </template>
        </CardContent>
      </Card>

      <!-- Export Modal (stub) -->
      <Dialog v-model:open="isExportModalOpen">
        <DialogContent class="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {{ t("analytics.logs.exportDialog.title") }}
            </DialogTitle>
            <DialogDescription>
              {{ t("analytics.logs.exportDialog.description") }}
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-6 py-4">
            <!-- Date Range -->
            <div class="space-y-2">
              <Label class="text-sm font-medium">
                {{ t("analytics.logs.exportDialog.dateRange") }}
              </Label>
              <Popover v-model:open="isCalendarOpen">
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    class="h-9 w-full justify-start text-left font-normal"
                  >
                    <Calendar :size="16" class="mr-2 text-muted-foreground" />
                    {{ formattedExportDateRange }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <RangeCalendar v-model="exportDateRange" />
                </PopoverContent>
              </Popover>
            </div>

            <!-- Event Types -->
            <div class="space-y-2">
              <Label class="text-sm font-medium">
                {{ t("analytics.logs.exportDialog.eventTypes") }}
              </Label>
              <div class="space-y-2">
                <div class="flex items-center space-x-2">
                  <Checkbox id="export-info" v-model="exportEventTypes.info" />
                  <label
                    for="export-info"
                    class="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {{ t("analytics.logs.exportDialog.info") }}
                  </label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox
                    id="export-warning"
                    v-model="exportEventTypes.warning"
                  />
                  <label
                    for="export-warning"
                    class="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {{ t("analytics.logs.exportDialog.warning") }}
                  </label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox id="export-error" v-model="exportEventTypes.error" />
                  <label
                    for="export-error"
                    class="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {{ t("analytics.logs.exportDialog.error") }}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="isExportModalOpen = false">
              {{ t("analytics.logs.exportDialog.cancel") }}
            </Button>
            <Button variant="outline" @click="handleExport('json')">
              <Download :size="16" class="mr-2" />
              {{ t("analytics.logs.exportDialog.exportJson") }}
            </Button>
            <Button @click="handleExport('csv')">
              <Download :size="16" class="mr-2" />
              {{ t("analytics.logs.exportDialog.exportCsv") }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>
