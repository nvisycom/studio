<script setup lang="ts">
import { ref } from "vue";
const { t } = useI18n();
import type { Component } from "vue";
import { MoreHorizontal, Edit, Trash2 } from "lucide-vue-next";
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

interface Integration {
	id: number;
	name: string;
	description: string;
	icon: Component;
	color: string;
	status: string;
	connectedAt: string;
}

const props = defineProps<{
	integrations: Integration[];
}>();

const emit = defineEmits<{
	(e: "configure", id: number): void;
	(e: "disconnect", id: number): void;
}>();
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>{{ t('integrations.table.headers.name') }}</TableHead>
        <TableHead>{{ t('integrations.table.headers.status') }}</TableHead>
        <TableHead>{{ t('integrations.table.headers.connectedAt') }}</TableHead>
        <TableHead class="w-24"></TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="integration in integrations" :key="integration.id">
        <TableCell>
          <div class="flex items-center gap-3">
            <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', integration.color]">
              <component :is="integration.icon" :size="20" class="text-white" />
            </div>
            <div>
              <p class="font-medium text-neutral-900 dark:text-white">{{ integration.name }}</p>
              <p class="text-xs text-neutral-600 dark:text-neutral-400">{{ integration.description }}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Switch :checked="true" disabled />
        </TableCell>
        <TableCell>
          <span class="text-sm text-neutral-600 dark:text-neutral-400">{{ integration.connectedAt }}</span>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm">
                <MoreHorizontal :size="16" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="emit('configure', integration.id)">
                <Edit :size="16" class="mr-2" />
                {{ t('integrations.table.actions.configure') }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="text-red-600 dark:text-red-400" @click="emit('disconnect', integration.id)">
                <Trash2 :size="16" class="mr-2" />
                {{ t('integrations.table.actions.disconnect') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
