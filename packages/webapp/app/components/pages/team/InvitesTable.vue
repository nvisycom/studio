<script setup lang="ts">
import type { Invite } from "@nvisy/sdk/datatypes";
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

interface Props {
  invites: Invite[];
  selectedInvites?: Set<string>;
  allSelected?: boolean;
}

interface Emits {
  (e: "cancel", inviteId: string): void;
  (e: "toggleSelectAll"): void;
  (e: "toggleInvite", inviteId: string): void;
  (e: "cancelSelected"): void;
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

function getInviteCode(invite: Invite): string {
  if (invite.inviteToken) {
    return `${invite.inviteToken.slice(0, 8)}...`;
  }
  return "";
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
          <TableHead class="uppercase text-xs font-light tracking-wider">{{
            t("members.table.headers.invite")
          }}</TableHead>
          <TableHead class="uppercase text-xs font-light tracking-wider">{{
            t("members.table.headers.role")
          }}</TableHead>
          <TableHead class="uppercase text-xs font-light tracking-wider">{{
            t("members.table.headers.invited")
          }}</TableHead>
          <TableHead class="uppercase text-xs font-light tracking-wider">{{
            t("members.table.headers.expires")
          }}</TableHead>
          <TableHead class="w-[50px]">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="ghost"
                  class="h-8 w-8 p-0"
                  :disabled="!selectedInvites || selectedInvites.size === 0"
                >
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
                  {{ t("members.table.actions.cancelSelected")
                  }}{{
                    selectedInvites && selectedInvites.size > 0
                      ? ` (${selectedInvites.size})`
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
          v-for="invite in invites"
          :key="invite.inviteId"
          class="border-b border-neutral-200 dark:border-neutral-800"
        >
          <TableCell>
            <Checkbox
              :model-value="selectedInvites?.has(invite.inviteId) || false"
              @update:model-value="emit('toggleInvite', invite.inviteId)"
              class="border-neutral-400 dark:border-neutral-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </TableCell>
          <TableCell>
            <div class="flex items-center gap-3">
              <EntityAvatar
                :name="invite.inviteeEmail || getInviteCode(invite)"
                size="md"
              />
              <div>
                <p
                  v-if="invite.inviteeEmail"
                  class="font-normal text-neutral-900 dark:text-white"
                >
                  {{ invite.inviteeEmail }}
                </p>
                <p
                  v-else
                  class="font-normal text-neutral-900 dark:text-white font-mono"
                >
                  {{ getInviteCode(invite) }}
                </p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{
                    invite.inviteeEmail
                      ? t("members.table.status.emailInvite")
                      : t("members.table.status.linkInvite")
                  }}
                </p>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <span
              class="text-xs text-neutral-700 dark:text-neutral-300 px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded"
            >
              {{ t(`members.roles.${invite.invitedRole}`) }}
            </span>
          </TableCell>
          <TableCell>
            <span
              class="text-xs font-light text-neutral-600 dark:text-neutral-400"
              >{{ formatDate(invite.createdAt) }}</span
            >
          </TableCell>
          <TableCell>
            <span
              class="text-xs font-light text-neutral-600 dark:text-neutral-400"
              >{{ formatDate(invite.expiresAt) }}</span
            >
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
                  @click="emit('cancel', invite.inviteId)"
                  class="text-red-600 dark:text-red-400 cursor-pointer"
                >
                  <X :size="14" class="mr-2" />
                  {{ t("members.table.actions.cancel") }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
  <div v-else class="py-12">
    <div class="text-center">
      <div
        class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
      >
        <Mail class="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
      </div>
      <p class="font-normal text-neutral-700 dark:text-neutral-300 mb-1">
        {{ t("members.table.empty.noPendingInvites") }}
      </p>
      <p class="font-light text-sm text-neutral-500 dark:text-neutral-400">
        {{ t("members.table.empty.noPendingInvitesDescription") }}
      </p>
    </div>
  </div>
</template>
