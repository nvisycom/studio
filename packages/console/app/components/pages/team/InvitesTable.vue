<script setup lang="ts">
import type { Invite } from "@nvisy/sdk/datatypes";
import { Mail, X, Copy, Trash2 } from "@lucide/vue";
import { toast } from "vue-sonner";
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
import {
	formatRelativeTime,
	formatRelativeTimeFuture,
} from "#console/utils/date";

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

defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

function getInviteCode(invite: Invite): string {
	if (invite.inviteToken) {
		return `${invite.inviteToken.slice(0, 8)}...`;
	}
	return "";
}

async function copyInviteLink(invite: Invite) {
	if (!invite.inviteToken) return;
	try {
		const inviteLink = `${window.location.origin}/join/${invite.inviteToken}`;
		await navigator.clipboard.writeText(inviteLink);
		toast.success(t("members.messages.linkCopied"));
	} catch {
		toast.error(t("members.errors.linkCopyFailed"));
	}
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
          <TableHead
            class="uppercase text-xs font-normal tracking-wider min-w-[280px]"
            >{{ t("members.table.headers.invite") }}</TableHead
          >
          <TableHead
            class="uppercase text-xs font-normal tracking-wider w-[140px]"
            >{{ t("members.table.headers.role") }}</TableHead
          >
          <TableHead
            class="uppercase text-xs font-normal tracking-wider w-[160px]"
            >{{ t("members.table.headers.invited") }}</TableHead
          >
          <TableHead
            class="uppercase text-xs font-normal tracking-wider w-[160px]"
            >{{ t("members.table.headers.expires") }}</TableHead
          >
        </TableRow>
      </TableHeader>
      <TableBody>
        <ContextMenu v-for="invite in invites" :key="invite.inviteId">
          <ContextMenuTrigger as-child>
            <TableRow
              class="border-b border-neutral-200 dark:border-neutral-800 cursor-pointer"
              @click="emit('toggleInvite', invite.inviteId)"
            >
              <TableCell @click.stop>
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
                  class="text-xs font-normal text-neutral-600 dark:text-neutral-400"
                  >{{ formatRelativeTime(invite.createdAt, t) }}</span
                >
              </TableCell>
              <TableCell>
                <span
                  class="text-xs font-normal text-neutral-600 dark:text-neutral-400"
                  >{{ formatRelativeTimeFuture(invite.expiresAt, t) }}</span
                >
              </TableCell>
            </TableRow>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <!-- Bulk actions when invite is selected -->
            <template
              v-if="
                selectedInvites?.has(invite.inviteId) &&
                selectedInvites.size > 1
              "
            >
              <ContextMenuItem
                class="text-red-600 dark:text-red-400 cursor-pointer"
                @click="emit('cancelSelected')"
              >
                <Trash2 :size="14" class="mr-2" />
                {{ t("members.table.actions.cancelSelected") }} ({{
                  selectedInvites.size
                }})
              </ContextMenuItem>
            </template>
            <!-- Single invite actions -->
            <template v-else>
              <ContextMenuItem
                v-if="invite.inviteToken"
                class="cursor-pointer"
                @click="copyInviteLink(invite)"
              >
                <Copy :size="14" class="mr-2" />
                {{ t("members.table.actions.copyLink") }}
              </ContextMenuItem>
              <ContextMenuSeparator v-if="invite.inviteToken" />
              <ContextMenuItem
                class="text-red-600 dark:text-red-400 cursor-pointer"
                @click="emit('cancel', invite.inviteId)"
              >
                <X :size="14" class="mr-2" />
                {{ t("members.table.actions.cancel") }}
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
        <Mail class="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
      </div>
      <p class="font-normal text-neutral-700 dark:text-neutral-300 mb-1">
        {{ t("members.table.empty.noPendingInvites") }}
      </p>
      <p class="font-normal text-sm text-neutral-500 dark:text-neutral-400">
        {{ t("members.table.empty.noPendingInvitesDescription") }}
      </p>
    </div>
  </div>
</template>
