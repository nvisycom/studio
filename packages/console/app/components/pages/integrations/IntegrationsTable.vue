<script setup lang="ts">
import type { Connection } from "@nvisy/sdk/datatypes";
import { Edit, Trash2, HardDrive, Webhook, Box } from "@lucide/vue";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#console/components/ui/table";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	ContextMenuSeparator,
} from "#console/components/ui/context-menu";
import { formatRelativeTime } from "#console/utils/date";

const { t } = useI18n();

defineProps<{
	connections: Connection[];
}>();

const emit = defineEmits<{
	(e: "configure", connectionId: string): void;
	(e: "disconnect", connectionId: string): void;
}>();

function getProviderIcon(provider: string) {
	switch (provider) {
		case "storage":
		case "s3":
			return HardDrive;
		case "webhook":
			return Webhook;
		default:
			return Box;
	}
}

function getProviderColor(provider: string): string {
	switch (provider) {
		case "storage":
		case "s3":
			return "bg-blue-600";
		case "webhook":
			return "bg-purple-600";
		default:
			return "bg-gray-600";
	}
}
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("integrations.table.headers.name")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("integrations.table.headers.provider")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("integrations.table.headers.connectedAt")
        }}</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <ContextMenu v-for="connection in connections" :key="connection.id">
        <ContextMenuTrigger as-child>
          <TableRow
            class="hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer"
          >
            <TableCell>
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    getProviderColor(connection.provider),
                  ]"
                >
                  <component
                    :is="getProviderIcon(connection.provider)"
                    :size="20"
                    class="text-white"
                  />
                </div>
                <div>
                  <p class="font-normal text-neutral-900 dark:text-white">
                    {{ connection.name }}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span
                class="text-sm font-normal text-neutral-600 dark:text-neutral-400 capitalize"
                >{{ connection.provider }}</span
              >
            </TableCell>
            <TableCell>
              <span
                class="text-sm font-normal text-neutral-600 dark:text-neutral-400"
                >{{ formatRelativeTime(connection.createdAt, t) }}</span
              >
            </TableCell>
          </TableRow>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            class="cursor-pointer"
            @click="emit('configure', connection.id)"
          >
            <Edit :size="14" class="mr-2" />
            {{ t("integrations.table.actions.configure") }}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            class="text-red-600 dark:text-red-400 cursor-pointer"
            @click="emit('disconnect', connection.id)"
          >
            <Trash2 :size="14" class="mr-2" />
            {{ t("integrations.table.actions.disconnect") }}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </TableBody>
  </Table>
</template>
