<script setup lang="ts">
import type { Integration } from "@nvisy/sdk/datatypes";
import { Edit, Trash2, HardDrive, Webhook, Box } from "@lucide/vue";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { formatRelativeTime } from "@/utils/date";

const { t } = useI18n();

defineProps<{
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
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("integrations.table.headers.name")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("integrations.table.headers.status")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("integrations.table.headers.connectedAt")
        }}</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <ContextMenu
        v-for="integration in integrations"
        :key="integration.integrationId"
      >
        <ContextMenuTrigger as-child>
          <TableRow
            class="hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer"
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
                    class="text-xs font-normal text-neutral-600 dark:text-neutral-400"
                  >
                    {{ integration.description }}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge :variant="integration.isActive ? 'default' : 'secondary'">
                {{
                  integration.isActive
                    ? t("integrations.status.active")
                    : t("integrations.status.inactive")
                }}
              </Badge>
            </TableCell>
            <TableCell>
              <span
                class="text-sm font-normal text-neutral-600 dark:text-neutral-400"
                >{{ formatRelativeTime(integration.createdAt, t) }}</span
              >
            </TableCell>
          </TableRow>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            class="cursor-pointer"
            @click="emit('configure', integration.integrationId)"
          >
            <Edit :size="14" class="mr-2" />
            {{ t("integrations.table.actions.configure") }}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            class="text-red-600 dark:text-red-400 cursor-pointer"
            @click="emit('disconnect', integration.integrationId)"
          >
            <Trash2 :size="14" class="mr-2" />
            {{ t("integrations.table.actions.disconnect") }}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </TableBody>
  </Table>
</template>
