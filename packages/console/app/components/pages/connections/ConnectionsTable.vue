<script setup lang="ts">
import type { Connection } from "@nvisy/sdk/datatypes";
import type { RowAction } from "#console/components/pages/RowActions.vue";
import type { VirtualColumn } from "#console/components/ui/virtual-table";
import { Edit, Trash2, HardDrive, RefreshCw, PlugZap } from "@lucide/vue";
import { Switch } from "#console/components/ui/switch";
import { VirtualTable } from "#console/components/ui/virtual-table";
import { providerIcon, providerLabel } from "#console/utils/connections";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();

defineProps<{
	connections: Connection[];
}>();

const emit = defineEmits<{
	(e: "configure", connectionId: string): void;
	(e: "disconnect", connectionId: string): void;
	(e: "sync", connectionId: string): void;
	(e: "test", connectionId: string): void;
	(e: "toggleActive", connection: Connection): void;
}>();

const columns = computed<VirtualColumn<Connection>[]>(() => [
	{
		key: "name",
		header: t("connections.table.headers.name"),
		cell: () => ({ type: "custom" }),
	},
	{
		key: "enabled",
		header: t("connections.table.headers.enabled"),
		width: "100px",
		cell: () => ({ type: "custom" }),
	},
	{
		key: "syncMode",
		header: t("connections.table.headers.syncMode"),
		width: "120px",
		cell: (c) => ({
			type: "text",
			value: c.sync
				? t(`connections.dialogs.connect.syncModes.${c.sync.syncMode}`)
				: "—",
			muted: true,
		}),
	},
	{
		key: "schedule",
		header: t("connections.table.headers.schedule"),
		width: "120px",
		cell: (c) => ({
			type: "text",
			value: c.sync?.scheduleCron
				? t("connections.table.schedule.scheduled")
				: t("connections.table.schedule.manual"),
			muted: true,
		}),
	},
	{
		key: "lastSynced",
		header: t("connections.table.headers.lastSynced"),
		width: "160px",
		cell: (c) => ({
			type: "text",
			value: c.sync?.lastSynced
				? relativeTime(c.sync.lastSynced)
				: t("common.time.never"),
			muted: true,
		}),
	},
]);

function rowActions(connection: Connection): RowAction[] {
	return [
		{
			key: "sync",
			label: t("connections.table.actions.sync"),
			icon: RefreshCw,
			select: () => emit("sync", connection.id),
		},
		{
			key: "configure",
			label: t("connections.table.actions.configure"),
			icon: Edit,
			select: () => emit("configure", connection.id),
		},
		{
			key: "test",
			label: t("connections.table.actions.test"),
			icon: PlugZap,
			select: () => emit("test", connection.id),
		},
		{
			key: "disconnect",
			label: t("connections.table.actions.disconnect"),
			icon: Trash2,
			danger: true,
			separatorBefore: true,
			select: () => emit("disconnect", connection.id),
		},
	];
}
</script>

<template>
  <VirtualTable
    :rows="connections"
    :columns="columns"
    :row-actions="rowActions"
    :menu-label="t('connections.table.actions.menu')"
    max-height="60vh"
  >
    <!-- Name + provider logo -->
    <template #cell-name="{ row }">
      <div class="flex items-center gap-3">
        <div
          class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40"
        >
          <img
            v-if="providerIcon(row.provider)"
            :src="providerIcon(row.provider)!"
            :alt="row.provider"
            class="size-5 object-contain"
          />
          <HardDrive v-else :size="18" class="text-muted-foreground" />
        </div>
        <div class="min-w-0">
          <p class="truncate font-medium text-foreground">
            {{ row.displayName }}
          </p>
          <p class="truncate text-xs text-muted-foreground">
            {{ providerLabel(row.provider) }}
          </p>
        </div>
      </div>
    </template>

    <!-- Enabled toggle -->
    <template #cell-enabled="{ row }">
      <div @click.stop>
        <Switch
          :model-value="row.isActive"
          @update:model-value="emit('toggleActive', row)"
        />
      </div>
    </template>
  </VirtualTable>
</template>
