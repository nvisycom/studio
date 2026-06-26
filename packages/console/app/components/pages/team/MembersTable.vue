<script setup lang="ts">
import type { Member } from "@nvisy/sdk/datatypes";
import { Users, Trash2, UserCog } from "@lucide/vue";
import { EntityAvatar } from "#console/components/common";
import { Checkbox } from "#console/components/ui/checkbox";
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

interface Props {
	members: Member[];
	selectedMembers?: Set<string>;
	allSelected?: boolean;
}

interface Emits {
	(e: "remove", memberId: string): void;
	(e: "edit", memberId: string): void;
	(e: "toggleSelectAll"): void;
	(e: "toggleMember", memberId: string): void;
	(e: "deleteSelected"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

function canSelectMember(member: Member): boolean {
	return member.memberRole !== "owner";
}

function handleRowClick(member: Member) {
	if (canSelectMember(member)) {
		emit("toggleMember", member.accountId);
	}
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
          <TableHead
            class="uppercase text-xs font-normal tracking-wider min-w-[280px]"
            >{{ t("members.table.headers.member") }}</TableHead
          >
          <TableHead
            class="uppercase text-xs font-normal tracking-wider w-[140px]"
            >{{ t("members.table.headers.role") }}</TableHead
          >
          <TableHead
            class="uppercase text-xs font-normal tracking-wider w-[160px]"
            >{{ t("members.table.headers.twoFA") }}</TableHead
          >
          <TableHead
            class="uppercase text-xs font-normal tracking-wider w-[160px]"
            >{{ t("members.table.headers.joined") }}</TableHead
          >
        </TableRow>
      </TableHeader>
      <TableBody>
        <ContextMenu v-for="member in members" :key="member.accountId">
          <ContextMenuTrigger as-child>
            <TableRow
              :class="[
                'border-b border-neutral-200 dark:border-neutral-800',
                canSelectMember(member) ? 'cursor-pointer' : 'cursor-default',
              ]"
              @click="handleRowClick(member)"
            >
              <TableCell @click.stop>
                <Checkbox
                  :model-value="selectedMembers?.has(member.accountId) || false"
                  @update:model-value="emit('toggleMember', member.accountId)"
                  :disabled="!canSelectMember(member)"
                  class="border-neutral-400 dark:border-neutral-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-3">
                  <EntityAvatar :name="member.displayName" size="md" />
                  <div>
                    <p class="font-normal text-neutral-900 dark:text-white">
                      {{ member.displayName }}
                    </p>
                    <p class="text-xs text-neutral-600 dark:text-neutral-400">
                      {{ member.emailAddress }}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span
                  class="text-xs text-neutral-700 dark:text-neutral-300 px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded"
                >
                  {{ t(`members.roles.${member.memberRole}`) }}
                </span>
              </TableCell>
              <TableCell>
                <span
                  :class="[
                    'text-xs px-2 py-1 rounded',
                    member.has2fa
                      ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
                      : 'text-neutral-500 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800',
                  ]"
                >
                  {{
                    member.has2fa
                      ? t("members.table.status.enabled")
                      : t("members.table.status.disabled")
                  }}
                </span>
              </TableCell>
              <TableCell>
                <span
                  class="text-xs font-normal text-neutral-600 dark:text-neutral-400"
                  >{{ formatRelativeTime(member.createdAt, t) }}</span
                >
              </TableCell>
            </TableRow>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <!-- Bulk actions when member is selected -->
            <template
              v-if="
                selectedMembers?.has(member.accountId) &&
                selectedMembers.size > 1
              "
            >
              <ContextMenuItem
                class="text-red-600 dark:text-red-400 cursor-pointer"
                @click="emit('deleteSelected')"
              >
                <Trash2 :size="14" class="mr-2" />
                {{ t("members.table.actions.deleteSelected") }} ({{
                  selectedMembers.size
                }})
              </ContextMenuItem>
            </template>
            <!-- Single member actions -->
            <template v-else>
              <ContextMenuItem
                class="cursor-pointer"
                :disabled="!canSelectMember(member)"
                @click="emit('edit', member.accountId)"
              >
                <UserCog :size="14" class="mr-2" />
                {{ t("members.table.actions.edit") }}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                class="text-red-600 dark:text-red-400 cursor-pointer"
                :disabled="!canSelectMember(member)"
                @click="emit('remove', member.accountId)"
              >
                <Trash2 :size="14" class="mr-2" />
                {{ t("members.table.actions.delete") }}
              </ContextMenuItem>
            </template>
          </ContextMenuContent>
        </ContextMenu>
      </TableBody>
    </Table>
  </div>
  <div v-else class="py-12">
    <div class="text-center">
      <div
        class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
      >
        <Users class="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
      </div>
      <p class="font-normal text-neutral-700 dark:text-neutral-300 mb-1">
        {{ t("members.table.empty.noMembers") }}
      </p>
      <p class="font-normal text-sm text-neutral-500 dark:text-neutral-400">
        {{ t("members.table.empty.noMembersDescription") }}
      </p>
    </div>
  </div>
</template>
