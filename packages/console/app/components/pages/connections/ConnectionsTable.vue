<script setup lang="ts">
import type { Connection } from "@nvisy/sdk/datatypes";
import {
	Edit,
	Trash2,
	HardDrive,
	MoreHorizontal,
	RefreshCw,
	PlugZap,
} from "@lucide/vue";
import { Switch } from "#console/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#console/components/ui/table";
import { Button } from "#console/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	ContextMenuSeparator,
} from "#console/components/ui/context-menu";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import {
	providerIcon,
	providerLabel,
} from "#console/utils/connectionProviders";
import { formatRelativeTime } from "#console/utils/date";

const { t } = useI18n();

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
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="text-xs font-normal uppercase tracking-wider">
          {{ t("connections.table.headers.name") }}
        </TableHead>
        <TableHead class="text-xs font-normal uppercase tracking-wider">
          {{ t("connections.table.headers.enabled") }}
        </TableHead>
        <TableHead class="text-xs font-normal uppercase tracking-wider">
          {{ t("connections.table.headers.syncMode") }}
        </TableHead>
        <TableHead class="text-xs font-normal uppercase tracking-wider">
          {{ t("connections.table.headers.schedule") }}
        </TableHead>
        <TableHead class="text-xs font-normal uppercase tracking-wider">
          {{ t("connections.table.headers.lastSynced") }}
        </TableHead>
        <TableHead class="w-10" />
      </TableRow>
    </TableHeader>
    <TableBody>
      <ContextMenu v-for="connection in connections" :key="connection.id">
        <ContextMenuTrigger as-child>
          <TableRow class="group cursor-pointer">
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
                    ? formatRelativeTime(connection.sync.lastSynced, t)
                    : t("common.time.never")
                }}
              </span>
            </TableCell>

            <!-- Actions -->
            <TableCell class="text-right" @click.stop>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                    :aria-label="t('connections.table.actions.menu')"
                  >
                    <MoreHorizontal :size="16" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="emit('sync', connection.id)">
                    <RefreshCw :size="14" class="mr-2" />
                    {{ t("connections.table.actions.sync") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="emit('configure', connection.id)">
                    <Edit :size="14" class="mr-2" />
                    {{ t("connections.table.actions.configure") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="emit('test', connection.id)">
                    <PlugZap :size="14" class="mr-2" />
                    {{ t("connections.table.actions.test") }}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    class="text-destructive focus:text-destructive"
                    @click="emit('disconnect', connection.id)"
                  >
                    <Trash2 :size="14" class="mr-2" />
                    {{ t("connections.table.actions.disconnect") }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            class="cursor-pointer"
            @click="emit('sync', connection.id)"
          >
            <RefreshCw :size="14" class="mr-2" />
            {{ t("connections.table.actions.sync") }}
          </ContextMenuItem>
          <ContextMenuItem
            class="cursor-pointer"
            @click="emit('configure', connection.id)"
          >
            <Edit :size="14" class="mr-2" />
            {{ t("connections.table.actions.configure") }}
          </ContextMenuItem>
          <ContextMenuItem
            class="cursor-pointer"
            @click="emit('test', connection.id)"
          >
            <PlugZap :size="14" class="mr-2" />
            {{ t("connections.table.actions.test") }}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            class="cursor-pointer text-destructive focus:text-destructive"
            @click="emit('disconnect', connection.id)"
          >
            <Trash2 :size="14" class="mr-2" />
            {{ t("connections.table.actions.disconnect") }}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </TableBody>
  </Table>
</template>
