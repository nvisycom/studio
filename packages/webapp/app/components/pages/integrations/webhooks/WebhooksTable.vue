<script setup lang="ts">
import type { Webhook } from "@nvisy/sdk";
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

const { t } = useI18n();

const props = defineProps<{
  webhooks: Webhook[];
}>();

const emit = defineEmits<{
  (e: "edit", webhook: Webhook): void;
  (e: "delete", webhook: Webhook): void;
  (e: "test", webhook: Webhook): void;
}>();

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return t("integrations.time.justNow");

  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (hours < 1) return t("integrations.time.justNow");
  if (hours < 24) return t("integrations.time.hoursAgo", { hours });
  if (days === 1) return t("integrations.time.daysAgo", { days: 1 });
  if (days < 7) return t("integrations.time.daysAgo", { days });
  if (weeks === 1) return t("integrations.time.weeksAgo", { weeks: 1 });
  if (weeks < 4) return t("integrations.time.weeksAgo", { weeks });
  if (months === 1) return t("integrations.time.monthsAgo", { months: 1 });
  return t("integrations.time.monthsAgo", { months });
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
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="uppercase text-xs font-light tracking-wider">{{
          t("integrations.table.headers.name")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-light tracking-wider">{{
          t("integrations.table.headers.status")
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
          <Switch :checked="webhook.status === 'active'" disabled />
        </TableCell>
        <TableCell>
          <span
            class="text-xs font-light text-neutral-600 dark:text-neutral-400"
          >
            {{ webhook.events.length }} event{{
              webhook.events.length !== 1 ? "s" : ""
            }}
          </span>
        </TableCell>
        <TableCell>
          <span
            class="text-sm font-light text-neutral-600 dark:text-neutral-400"
          >
            {{ formatDate(webhook.lastSuccessAt) }}
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
              <DropdownMenuItem @click="emit('edit', webhook)">
                <Edit :size="16" class="mr-2" />
                {{ t("integrations.table.actions.configure") }}
              </DropdownMenuItem>
              <DropdownMenuItem @click="emit('test', webhook)">
                <Play :size="16" class="mr-2" />
                {{ t("integrations.table.actions.test") }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                @click="emit('delete', webhook)"
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
