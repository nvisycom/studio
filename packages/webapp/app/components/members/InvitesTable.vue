<script setup lang="ts">
import { Mail, MoreHorizontal, X } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { EntityAvatar } from "@/components/common";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/dropdown-menu";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";

/**
 * Pending invitation data structure
 */
interface Invite {
	id: string;
	name: string;
	email: string;
	role: string;
	invitedDate: Date;
}

/**
 * Component props interface
 */
interface Props {
	invites: Invite[];
	selectedInvites?: Set<string>;
	allSelected?: boolean;
}

/**
 * Component emits interface
 */
interface Emits {
	(e: "cancel", inviteId: string): void;
	(e: "toggleSelectAll"): void;
	(e: "toggleInvite", inviteId: string): void;
	(e: "cancelSelected"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

/**
 * Format a date object to a readable string
 * @param date - The date to format
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
function formatDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}
</script>

<template>
  <div v-if="invites.length > 0">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="w-[50px]">
            <Checkbox
              :model-value="allSelected"
              @update:model-value="emit('toggleSelectAll')"
              class="border-neutral-400 dark:border-neutral-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </TableHead>
          <TableHead>{{ t('members.table.headers.invite') }}</TableHead>
          <TableHead>{{ t('members.table.headers.role') }}</TableHead>
          <TableHead>{{ t('members.table.headers.invited') }}</TableHead>
          <TableHead class="w-[50px]">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" class="h-8 w-8 p-0" :disabled="!selectedInvites || selectedInvites.size === 0">
                  <MoreHorizontal :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  @click="emit('cancelSelected')"
                  class="text-red-600 dark:text-red-400 cursor-pointer"
                  :disabled="!selectedInvites || selectedInvites.size === 0"
                >
                  <X :size="16" class="mr-2" />
                  {{ t('members.table.actions.cancelSelected') }}{{ selectedInvites && selectedInvites.size > 0 ? ` (${selectedInvites.size})` : '' }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="invite in invites" :key="invite.id" class="border-b border-neutral-200 dark:border-neutral-800">
          <TableCell>
            <Checkbox
              :model-value="selectedInvites?.has(invite.id) || false"
              @update:model-value="emit('toggleInvite', invite.id)"
              class="border-neutral-400 dark:border-neutral-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </TableCell>
          <TableCell>
            <div class="flex items-center gap-3">
              <EntityAvatar
                :name="invite.name"
                size="md"
              />
              <div>
                <p class="font-medium text-neutral-900 dark:text-white">{{ invite.name }}</p>
                <p class="text-xs text-neutral-600 dark:text-neutral-400">{{ invite.email }}</p>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <span class="text-xs text-neutral-700 dark:text-neutral-300 px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded">
              {{ t(`members.roles.${invite.role}`) }}
            </span>
          </TableCell>
          <TableCell>
            <span class="text-xs text-neutral-600 dark:text-neutral-400">{{ formatDate(invite.invitedDate) }}</span>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                  <MoreHorizontal :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  @click="emit('cancel', invite.id)"
                  class="text-red-600 dark:text-red-400 cursor-pointer"
                >
                  <X :size="14" class="mr-2" />
                  {{ t('members.table.actions.cancel') }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
  <Empty v-else>
    <EmptyHeader>
      <Mail :size="48" class="mx-auto text-neutral-400 mb-4" />
      <EmptyTitle>{{ t('members.table.empty.noPendingInvites') }}</EmptyTitle>
      <EmptyDescription>
        {{ t('members.table.empty.noPendingInvitesDescription') }}
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
</template>
