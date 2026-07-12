<script setup lang="ts">
import type { Webhook } from "@nvisy/sdk/datatypes";
import { Edit, Play, Trash2 } from "@lucide/vue";
import { Switch } from "#console/components/ui/switch";
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
	webhooks: Webhook[];
}>();

const emit = defineEmits<{
	(e: "edit", webhookId: string): void;
	(e: "delete", webhookId: string): void;
	(e: "test", webhookId: string): void;
	(e: "toggleStatus", webhookId: string, active: boolean): void;
}>();

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
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("connections.table.headers.name")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("connections.table.headers.enabled")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("connections.table.headers.events")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("connections.table.headers.headers")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("connections.table.headers.created")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("connections.table.headers.lastDelivery")
        }}</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <ContextMenu v-for="webhook in webhooks" :key="webhook.webhookId">
        <ContextMenuTrigger as-child>
          <TableRow
            class="hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer"
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
                  emit('toggleStatus', webhook.webhookId, $event)
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
                class="text-xs font-normal text-neutral-600 dark:text-neutral-400"
              >
                {{ Object.keys(webhook.headers || {}).length }}
              </span>
            </TableCell>
            <TableCell>
              <span
                class="text-sm font-normal text-neutral-600 dark:text-neutral-400"
              >
                {{ formatRelativeTime(webhook.createdAt, t) }}
              </span>
            </TableCell>
            <TableCell>
              <span
                class="text-sm font-normal text-neutral-600 dark:text-neutral-400"
              >
                {{ formatRelativeTime(webhook.lastTriggeredAt, t) }}
              </span>
            </TableCell>
          </TableRow>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            class="cursor-pointer"
            @click="emit('edit', webhook.webhookId)"
          >
            <Edit :size="14" class="mr-2" />
            {{ t("connections.table.actions.configure") }}
          </ContextMenuItem>
          <ContextMenuItem
            class="cursor-pointer"
            @click="emit('test', webhook.webhookId)"
          >
            <Play :size="14" class="mr-2" />
            {{ t("connections.table.actions.test") }}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            class="text-red-600 dark:text-red-400 cursor-pointer"
            @click="emit('delete', webhook.webhookId)"
          >
            <Trash2 :size="14" class="mr-2" />
            {{ t("connections.table.actions.delete") }}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </TableBody>
  </Table>
</template>
