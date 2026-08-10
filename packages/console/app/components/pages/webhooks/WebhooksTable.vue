<script setup lang="ts">
import type { Webhook } from "@nvisy/sdk/datatypes";
import type { RowAction } from "#console/components/pages/RowActions.vue";
import { Edit, Play, Trash2 } from "@lucide/vue";
import { Switch } from "#console/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableRow,
} from "#console/components/ui/table";
import DataTableHead from "#console/components/pages/DataTableHead.vue";
import RowActions from "#console/components/pages/RowActions.vue";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();

defineProps<{
	webhooks: Webhook[];
}>();

const emit = defineEmits<{
	(e: "edit", webhookId: string): void;
	(e: "delete", webhookId: string): void;
	(e: "test", webhookId: string): void;
	(e: "toggleStatus", webhookId: string, active: boolean): void;
}>();

/** Right-click / ⋯ actions for a webhook row. */
function rowActions(webhook: Webhook): RowAction[] {
	return [
		{
			key: "configure",
			label: t("connections.table.actions.configure"),
			icon: Edit,
			select: () => emit("edit", webhook.id),
		},
		{
			key: "test",
			label: t("connections.table.actions.test"),
			icon: Play,
			select: () => emit("test", webhook.id),
		},
		{
			key: "delete",
			label: t("connections.table.actions.delete"),
			icon: Trash2,
			danger: true,
			separatorBefore: true,
			select: () => emit("delete", webhook.id),
		},
	];
}

function formatUrl(url: string): string {
	try {
		const urlObj = new URL(url);
		const domain = urlObj.hostname;
		const path = urlObj.pathname !== "/" ? urlObj.pathname : "";
		return domain + path;
	} catch {
		return url;
	}
}

// Most recent delivery: whichever of the last success / last failure is newer,
// plus whether that delivery failed and how many failures have piled up since
// the last success (0 while healthy).
function lastDelivery(webhook: Webhook): {
	at?: string;
	failed: boolean;
	consecutiveFailures: number;
} {
	const success = webhook.lastSuccessAt;
	const failure = webhook.lastFailureAt;
	const failed = !!failure && (!success || failure > success);
	return {
		at: failed ? failure : (success ?? failure),
		failed,
		consecutiveFailures: webhook.consecutiveFailures,
	};
}
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <DataTableHead>{{ t("connections.table.headers.name") }}</DataTableHead>
        <DataTableHead>
          {{ t("connections.table.headers.enabled") }}
        </DataTableHead>
        <DataTableHead>{{ t("connections.table.headers.events") }}</DataTableHead>
        <DataTableHead>
          {{ t("connections.table.headers.created") }}
        </DataTableHead>
        <DataTableHead>
          {{ t("connections.table.headers.lastDelivery") }}
        </DataTableHead>
        <DataTableHead class="w-10" />
      </TableRow>
    </TableHeader>
    <TableBody>
      <RowActions
        v-for="webhook in webhooks"
        :key="webhook.id"
        :actions="rowActions(webhook)"
        :menu-label="t('connections.table.actions.menu')"
        row-class="group hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer"
      >
            <TableCell>
              <div class="min-w-0">
                <p class="font-normal text-neutral-900 dark:text-white">
                  {{ webhook.displayName }}
                </p>
                <p
                  class="text-xs font-normal text-neutral-600 dark:text-neutral-400 truncate font-mono"
                >
                  {{ formatUrl(webhook.url) }}
                </p>
              </div>
            </TableCell>
            <TableCell @click.stop>
              <Switch
                :model-value="webhook.status === 'active'"
                :disabled="webhook.status === 'disabled'"
                @update:model-value="
                  emit('toggleStatus', webhook.id, $event)
                "
              />
            </TableCell>
            <TableCell>
              <span
                class="text-xs font-normal text-neutral-600 dark:text-neutral-400"
              >
                {{
                  t("connections.table.eventsCount", {
                    count: webhook.events.length,
                  })
                }}
              </span>
            </TableCell>
            <TableCell>
              <span
                class="text-sm font-normal text-neutral-600 dark:text-neutral-400"
              >
                {{ relativeTime(webhook.createdAt) }}
              </span>
            </TableCell>
            <TableCell>
              <div
                v-if="lastDelivery(webhook).at"
                class="flex items-center gap-2"
              >
                <span
                  class="size-1.5 rounded-full shrink-0"
                  :class="
                    lastDelivery(webhook).failed
                      ? 'bg-red-500'
                      : 'bg-green-500'
                  "
                />
                <span
                  class="text-sm font-normal text-neutral-600 dark:text-neutral-400"
                >
                  {{ relativeTime(lastDelivery(webhook).at) }}
                </span>
                <span
                  v-if="lastDelivery(webhook).consecutiveFailures > 0"
                  class="text-xs font-normal text-red-600 dark:text-red-400"
                >
                  {{
                    t("connections.table.consecutiveFailures", {
                      count: lastDelivery(webhook).consecutiveFailures,
                    })
                  }}
                </span>
              </div>
              <span
                v-else
                class="text-sm font-normal text-neutral-500 dark:text-neutral-500"
              >
                {{ t("connections.table.neverDelivered") }}
              </span>
            </TableCell>
      </RowActions>
    </TableBody>
  </Table>
</template>
