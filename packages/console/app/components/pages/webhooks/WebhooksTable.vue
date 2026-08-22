<script setup lang="ts">
import type { Webhook } from "@nvisy/sdk/datatypes";
import type { RowAction } from "#console/components/pages/RowActions.vue";
import type {
	VirtualColumn,
	VirtualTableEmpty,
} from "#console/components/ui/virtual-table";
import { Edit, Play, Trash2 } from "@lucide/vue";
import { Switch } from "#console/components/ui/switch";
import { VirtualTable } from "#console/components/ui/virtual-table";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();

const props = defineProps<{
	webhooks: Webhook[];
	empty?: VirtualTableEmpty;
}>();

const emit = defineEmits<{
	(e: "edit", webhookId: string): void;
	(e: "delete", webhookId: string): void;
	(e: "test", webhookId: string): void;
	(e: "toggleStatus", webhookId: string, active: boolean): void;
}>();

function formatUrl(url: string): string {
	try {
		const u = new URL(url);
		return u.hostname + (u.pathname !== "/" ? u.pathname : "");
	} catch {
		return url;
	}
}

// Most recent delivery: whichever of the last success / last failure is newer,
// plus whether it failed and the failures piled up since the last success.
function lastDelivery(webhook: Webhook) {
	const success = webhook.lastSuccessAt;
	const failure = webhook.lastFailureAt;
	const failed = !!failure && (!success || failure > success);
	return {
		at: failed ? failure : (success ?? failure),
		failed,
		consecutiveFailures: webhook.consecutiveFailures,
	};
}

const columns = computed<VirtualColumn<Webhook>[]>(() => [
	{
		key: "name",
		header: t("connections.table.headers.name"),
		cell: (w) => ({
			type: "primary",
			title: w.displayName,
			subtitle: formatUrl(w.url),
		}),
	},
	{
		key: "enabled",
		header: t("connections.table.headers.enabled"),
		width: "100px",
		cell: () => ({ type: "custom" }),
	},
	{
		key: "events",
		header: t("connections.table.headers.events"),
		width: "120px",
		cell: (w) => ({
			type: "text",
			value: t("connections.table.eventsCount", { count: w.events.length }),
			muted: true,
		}),
	},
	{
		key: "created",
		header: t("connections.table.headers.created"),
		width: "140px",
		cell: (w) => ({
			type: "text",
			value: relativeTime(w.createdAt),
			muted: true,
		}),
	},
	{
		key: "lastDelivery",
		header: t("connections.table.headers.lastDelivery"),
		width: "200px",
		cell: () => ({ type: "custom" }),
	},
]);

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
</script>

<template>
  <VirtualTable
    :rows="webhooks"
    :columns="columns"
    :row-actions="rowActions"
    :menu-label="t('connections.table.actions.menu')"
    :empty="empty"
  >
    <!-- Enabled toggle -->
    <template #cell-enabled="{ row }">
      <div @click.stop>
        <Switch
          :model-value="row.status === 'enabled'"
          :disabled="row.status === 'suspended'"
          @update:model-value="emit('toggleStatus', row.id, $event)"
        />
      </div>
    </template>

    <!-- Last delivery: dot + relative time + consecutive-failure count -->
    <template #cell-lastDelivery="{ row }">
      <div v-if="lastDelivery(row).at" class="flex items-center gap-2">
        <span
          class="size-1.5 shrink-0 rounded-full"
          :class="lastDelivery(row).failed ? 'bg-red-500' : 'bg-green-500'"
        />
        <span class="text-sm text-muted-foreground">
          {{ relativeTime(lastDelivery(row).at) }}
        </span>
        <span
          v-if="lastDelivery(row).consecutiveFailures > 0"
          class="text-xs text-destructive"
        >
          {{
            t("connections.table.consecutiveFailures", {
              count: lastDelivery(row).consecutiveFailures,
            })
          }}
        </span>
      </div>
      <span v-else class="text-sm text-muted-foreground">
        {{ t("connections.table.neverDelivered") }}
      </span>
    </template>
  </VirtualTable>
</template>
