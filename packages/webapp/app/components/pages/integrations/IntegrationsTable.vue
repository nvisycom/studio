<script setup lang="ts">
import type { Integration } from "@nvisy/sdk";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  HardDrive,
  Webhook,
  Box,
} from "lucide-vue-next";
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
  integrations: Integration[];
}>();

const emit = defineEmits<{
  (e: "configure", integrationId: string): void;
  (e: "disconnect", integrationId: string): void;
}>();

function getIntegrationIcon(type: string) {
  switch (type) {
    case "storage":
      return HardDrive;
    case "webhook":
      return Webhook;
    default:
      return Box;
  }
}

function getIntegrationColor(type: string): string {
  switch (type) {
    case "storage":
      return "bg-blue-600";
    case "webhook":
      return "bg-purple-600";
    default:
      return "bg-gray-600";
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (days === 0) return t("integrations.time.justNow");
  if (days === 1) return t("integrations.time.daysAgo", { days: 1 });
  if (days < 7) return t("integrations.time.daysAgo", { days });
  if (weeks === 1) return t("integrations.time.weeksAgo", { weeks: 1 });
  if (weeks < 4) return t("integrations.time.weeksAgo", { weeks });
  if (months === 1) return t("integrations.time.monthsAgo", { months: 1 });
  return t("integrations.time.monthsAgo", { months });
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
          t("integrations.table.headers.connectedAt")
        }}</TableHead>
        <TableHead class="w-24"></TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow
        v-for="integration in integrations"
        :key="integration.integrationId"
      >
        <TableCell>
          <div class="flex items-center gap-3">
            <div
              :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center',
                getIntegrationColor(integration.integrationType),
              ]"
            >
              <component
                :is="getIntegrationIcon(integration.integrationType)"
                :size="20"
                class="text-white"
              />
            </div>
            <div>
              <p class="font-normal text-neutral-900 dark:text-white">
                {{ integration.integrationName }}
              </p>
              <p
                class="text-xs font-light text-neutral-600 dark:text-neutral-400"
              >
                {{ integration.description }}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Switch :checked="integration.isActive" disabled />
        </TableCell>
        <TableCell>
          <span
            class="text-sm font-light text-neutral-600 dark:text-neutral-400"
            >{{ formatDate(integration.createdAt) }}</span
          >
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm">
                <MoreHorizontal :size="16" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                @click="emit('configure', integration.integrationId)"
              >
                <Edit :size="16" class="mr-2" />
                {{ t("integrations.table.actions.configure") }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="text-red-600 dark:text-red-400"
                @click="emit('disconnect', integration.integrationId)"
              >
                <Trash2 :size="16" class="mr-2" />
                {{ t("integrations.table.actions.disconnect") }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
