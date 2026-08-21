<script setup lang="ts">
import type { Component } from "vue";
import {
	Download,
	Upload,
	Search,
	FileText,
	History,
	Link2,
	Loader2,
	Mail,
	Play,
	Settings2,
	ShieldCheck,
	Users,
	Webhook as WebhookIcon,
} from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Badge } from "#console/components/ui/badge";
import { EntityAvatar } from "#console/components/common";
import { personLabel } from "#console/utils/naming";
import { activityContent } from "#console/utils/activities";
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

// Activity category -> icon. Categories come from `activityContent`, which
// derives them from the typed payload's `activityType` (e.g. `file.created`).
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
const CATEGORIES = [
	"workspace",
	"member",
	"invite",
	"connection",
	"webhook",
	"file",
	"pipeline",
	"policy",
] as const;
function activityIcon(category: string): Component {
	return CATEGORY_ICON[category] ?? Settings2;
}

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

const filteredActivities = computed(() => {
	let list = activityRows.value;
	if (category.value !== "all") {
		list = list.filter((a) => a.category === category.value);
	}
	if (searchQuery.value.trim()) {
		const q = searchQuery.value.toLowerCase();
		list = list.filter(
			(a) =>
				a.text.toLowerCase().includes(q) ||
				a.category.toLowerCase().includes(q),
		);
	}
	return list;
});

// Import is on-premise-only and not wired yet; export has no backend either, so
// both stay disabled (export was a fake modal — removed). Wire these once the
// log export/import endpoints exist.
const isOnPremise = ref(false);
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
              {{ t(`activities.category.${c}`) }}
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
              <!-- Export has no backend yet; disabled until it does. -->
              <Button variant="outline" size="sm" disabled>
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
                        :is="activity.icon"
                        :size="12"
                        :stroke-width="1.75"
                      />
                      {{ t(`activities.category.${activity.category}`) }}
                    </Badge>
                  </TableCell>
                  <TableCell class="max-w-md truncate text-sm text-foreground">
                    {{ activity.text }}
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

    </div>
  </div>
</template>
