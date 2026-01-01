<script setup lang="ts">
import type { Member } from "@nvisy/sdk/datatypes";
import { Users, MoreHorizontal, Trash2 } from "lucide-vue-next";
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
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

interface Props {
  members: Member[];
  selectedMembers?: Set<string>;
  allSelected?: boolean;
}

interface Emits {
  (e: "remove", memberId: string): void;
  (e: "toggleSelectAll"): void;
  (e: "toggleMember", memberId: string): void;
  (e: "deleteSelected"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
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
          <TableHead class="uppercase text-xs font-light tracking-wider">{{
            t("members.table.headers.member")
          }}</TableHead>
          <TableHead class="uppercase text-xs font-light tracking-wider">{{
            t("members.table.headers.role")
          }}</TableHead>
          <TableHead class="uppercase text-xs font-light tracking-wider">{{
            t("members.table.headers.twoFA")
          }}</TableHead>
          <TableHead class="uppercase text-xs font-light tracking-wider">{{
            t("members.table.headers.joined")
          }}</TableHead>
          <TableHead class="w-[50px]">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="ghost"
                  class="h-8 w-8 p-0"
                  :disabled="!selectedMembers || selectedMembers.size === 0"
                >
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
                  {{ t("members.table.actions.deleteSelected")
                  }}{{
                    selectedMembers && selectedMembers.size > 0
                      ? ` (${selectedMembers.size})`
                      : ""
                  }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="member in members"
          :key="member.accountId"
          class="border-b border-neutral-200 dark:border-neutral-800"
        >
          <TableCell>
            <Checkbox
              :model-value="selectedMembers?.has(member.accountId) || false"
              @update:model-value="emit('toggleMember', member.accountId)"
              :disabled="member.memberRole === 'owner'"
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
              class="text-xs font-light text-neutral-600 dark:text-neutral-400"
              >{{ formatDate(member.createdAt) }}</span
            >
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-8 w-8 p-0"
                  :disabled="member.memberRole === 'owner'"
                >
                  <MoreHorizontal :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  @click="emit('remove', member.accountId)"
                  :disabled="member.memberRole === 'owner'"
                  class="text-red-600 dark:text-red-400 cursor-pointer"
                >
                  <Trash2 :size="14" class="mr-2" />
                  {{ t("members.table.actions.delete") }}
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
      <EmptyTitle>{{ t("members.table.empty.noMembers") }}</EmptyTitle>
      <EmptyDescription>
        {{ t("members.table.empty.noMembersDescription") }}
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
</template>
