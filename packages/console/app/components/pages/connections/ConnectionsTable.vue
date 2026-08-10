<script setup lang="ts">
import type { Connection } from "@nvisy/sdk/datatypes";
import type { RowAction } from "#console/components/pages/RowActions.vue";
import { Edit, Trash2, HardDrive, RefreshCw, PlugZap } from "@lucide/vue";
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
import {
	providerIcon,
	providerLabel,
} from "#console/utils/connectionProviders";

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

/** Right-click / ⋯ actions for a connection row. */
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
  <Table>
    <TableHeader>
      <TableRow>
        <DataTableHead>{{ t("connections.table.headers.name") }}</DataTableHead>
        <DataTableHead>
          {{ t("connections.table.headers.enabled") }}
        </DataTableHead>
        <DataTableHead>
          {{ t("connections.table.headers.syncMode") }}
        </DataTableHead>
        <DataTableHead>
          {{ t("connections.table.headers.schedule") }}
        </DataTableHead>
        <DataTableHead>
          {{ t("connections.table.headers.lastSynced") }}
        </DataTableHead>
        <DataTableHead class="w-10" />
      </TableRow>
    </TableHeader>
    <TableBody>
      <RowActions
        v-for="connection in connections"
        :key="connection.id"
        :actions="rowActions(connection)"
        :menu-label="t('connections.table.actions.menu')"
        row-class="group cursor-pointer"
      >
            <!-- Name + provider logo -->
            <TableCell>
              <div class="flex items-center gap-3">
                <div
                  class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40"
                >
                  <img
                    v-if="providerIcon(connection.provider)"
                    :src="providerIcon(connection.provider)!"
                    :alt="connection.provider"
                    class="size-5 object-contain"
                  />
                  <HardDrive v-else :size="18" class="text-muted-foreground" />
                </div>
                <div class="min-w-0">
                  <p class="truncate font-medium text-foreground">
                    {{ connection.displayName }}
                  </p>
                  <p class="truncate text-xs text-muted-foreground">
                    {{ providerLabel(connection.provider) }}
                  </p>
                </div>
              </div>
            </TableCell>

            <!-- Enabled -->
            <TableCell @click.stop>
              <Switch
                :model-value="connection.isActive"
                @update:model-value="emit('toggleActive', connection)"
              />
            </TableCell>

            <!-- Sync mode -->
            <TableCell>
              <span class="text-sm text-muted-foreground">
                {{
                  connection.sync
                    ? t(
                        `connections.dialogs.connect.syncModes.${connection.sync.syncMode}`,
                      )
                    : "—"
                }}
              </span>
            </TableCell>

            <!-- Schedule -->
            <TableCell>
              <span class="text-sm text-muted-foreground">
                {{
                  connection.sync?.scheduleCron
                    ? t("connections.table.schedule.scheduled")
                    : t("connections.table.schedule.manual")
                }}
              </span>
            </TableCell>

            <!-- Last synced -->
            <TableCell>
              <span class="text-sm text-muted-foreground">
                {{
                  connection.sync?.lastSynced
                    ? relativeTime(connection.sync.lastSynced)
                    : t("common.time.never")
                }}
              </span>
            </TableCell>
      </RowActions>
    </TableBody>
  </Table>
</template>
