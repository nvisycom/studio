<script setup lang="ts">
import type { Webhook } from "@nvisy/sdk/datatypes";
import { MoreHorizontal, Edit, Play, Trash2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/utils/date";

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
        <TableHead class="uppercase text-xs font-light tracking-wider">{{
          t("integrations.table.headers.name")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-light tracking-wider">{{
          t("integrations.table.headers.enabled")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-light tracking-wider">{{
          t("integrations.table.headers.events")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-light tracking-wider">{{
          t("integrations.table.headers.lastDelivery")
        }}</TableHead>
        <TableHead class="w-24"></TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow
        v-for="webhook in webhooks"
        :key="webhook.webhookId"
        class="hover:bg-neutral-50 dark:hover:bg-neutral-900"
      >
        <TableCell>
          <div class="min-w-0">
            <p class="font-normal text-neutral-900 dark:text-white">
              {{ webhook.displayName }}
            </p>
            <p
              class="text-xs font-light text-neutral-600 dark:text-neutral-400 truncate font-mono"
            >
              {{ formatUrl(webhook.url) }}
            </p>
          </div>
        </TableCell>
        <TableCell>
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
            class="text-xs font-light text-neutral-600 dark:text-neutral-400"
          >
            {{
              t("integrations.table.eventsCount", {
                count: webhook.events.length,
              })
            }}
          </span>
        </TableCell>
        <TableCell>
          <span
            class="text-sm font-light text-neutral-600 dark:text-neutral-400"
          >
            {{ formatRelativeTime(webhook.lastTriggeredAt, t) }}
          </span>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm">
                <MoreHorizontal :size="16" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="emit('edit', webhook.webhookId)">
                <Edit :size="16" class="mr-2" />
                {{ t("integrations.table.actions.configure") }}
              </DropdownMenuItem>
              <DropdownMenuItem @click="emit('test', webhook.webhookId)">
                <Play :size="16" class="mr-2" />
                {{ t("integrations.table.actions.test") }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                @click="emit('delete', webhook.webhookId)"
                class="text-red-600 dark:text-red-400"
              >
                <Trash2 :size="16" class="mr-2" />
                {{ t("integrations.table.actions.delete") }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
