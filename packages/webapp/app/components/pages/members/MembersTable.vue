<script setup lang="ts">
import {
	Shield,
	ShieldOff,
	Users,
	MoreHorizontal,
	Trash2,
} from "lucide-vue-next";
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
 * Team member data structure
 */
interface Member {
	id: string;
	name: string;
	email: string;
	role: string;
	joinedDate: Date;
	twoFAEnabled: boolean;
}

/**
 * Component props interface
 */
interface Props {
	members: Member[];
	selectedMembers?: Set<string>;
	allSelected?: boolean;
}

/**
 * Component emits interface
 */
interface Emits {
	(e: "remove", memberId: string): void;
	(e: "toggleSelectAll"): void;
	(e: "toggleMember", memberId: string): void;
	(e: "deleteSelected"): void;
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
  <div v-if="members.length > 0">
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
          <TableHead>{{ t('members.table.headers.member') }}</TableHead>
          <TableHead>{{ t('members.table.headers.role') }}</TableHead>
          <TableHead>{{ t('members.table.headers.twoFA') }}</TableHead>
          <TableHead>{{ t('members.table.headers.joined') }}</TableHead>
          <TableHead class="w-[50px]">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" class="h-8 w-8 p-0" :disabled="!selectedMembers || selectedMembers.size === 0">
                  <MoreHorizontal :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  @click="emit('deleteSelected')"
                  class="text-red-600 dark:text-red-400 cursor-pointer"
                  :disabled="!selectedMembers || selectedMembers.size === 0"
                >
                  <Trash2 :size="16" class="mr-2" />
                  {{ t('members.table.actions.deleteSelected') }}{{ selectedMembers && selectedMembers.size > 0 ? ` (${selectedMembers.size})` : '' }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="member in members" :key="member.id" class="border-b border-neutral-200 dark:border-neutral-800">
          <TableCell>
            <Checkbox
              :model-value="selectedMembers?.has(member.id) || false"
              @update:model-value="emit('toggleMember', member.id)"
              :disabled="member.role === 'Owner'"
              class="border-neutral-400 dark:border-neutral-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </TableCell>
          <TableCell>
            <div class="flex items-center gap-3">
              <EntityAvatar
                :name="member.name"
                size="md"
              />
              <div>
                <p class="font-medium text-neutral-900 dark:text-white">{{ member.name }}</p>
                <p class="text-xs text-neutral-600 dark:text-neutral-400">{{ member.email }}</p>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <span class="text-xs text-neutral-700 dark:text-neutral-300 px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded">
              {{ t(`members.roles.${member.role}`) }}
            </span>
          </TableCell>
          <TableCell>
            <div class="flex items-center gap-1">
              <Shield v-if="member.twoFAEnabled" :size="14" class="text-green-500" />
              <ShieldOff v-else :size="14" class="text-neutral-500" />
              <span class="text-xs" :class="member.twoFAEnabled ? 'text-green-600 dark:text-green-400' : 'text-neutral-600 dark:text-neutral-400'">
                {{ member.twoFAEnabled ? t('members.table.status.enabled') : t('members.table.status.disabled') }}
              </span>
            </div>
          </TableCell>
          <TableCell>
            <span class="text-xs text-neutral-600 dark:text-neutral-400">{{ formatDate(member.joinedDate) }}</span>
          </TableCell>
          <TableCell>
            <!-- Options menu for all members -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0"
                  :disabled="member.role === 'Owner'"
                >
                  <MoreHorizontal :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  @click="emit('remove', member.id)"
                  :disabled="member.role === 'Owner'"
                  class="text-red-600 dark:text-red-400 cursor-pointer"
                >
                  <Trash2 :size="14" class="mr-2" />
                  {{ t('members.table.actions.delete') }}
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
      <Users :size="48" class="mx-auto text-neutral-400 mb-4" />
      <EmptyTitle>{{ t('members.table.empty.noMembers') }}</EmptyTitle>
      <EmptyDescription>
        {{ t('members.table.empty.noMembersDescription') }}
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
</template>
