<script setup lang="ts">
import type { Invite } from "@nvisy/sdk/datatypes";
import type {
	RowAction,
	RowSelection,
} from "#console/components/pages/RowActions.vue";
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
import DataTableHead from "#console/components/pages/DataTableHead.vue";
import RowActions from "#console/components/pages/RowActions.vue";

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
const { relativeTime, relativeTimeFuture } = useRelativeTime();

/** Per-row menu: copy link (only if the invite has a token), then cancel. */
function rowActions(invite: Invite): RowAction[] {
	const actions: RowAction[] = [];
	if (invite.inviteToken) {
		actions.push({
			key: "copy",
			label: t("members.table.actions.copyLink"),
			icon: Copy,
			select: () => copyInviteLink(invite),
		});
	}
	actions.push({
		key: "cancel",
		label: t("members.table.actions.cancel"),
		icon: X,
		danger: true,
		separatorBefore: actions.length > 0,
		select: () => emit("cancel", invite.inviteId),
	});
	return actions;
}

/** Selection state for a row, driving the bulk-vs-single menu. */
function rowSelection(invite: Invite): RowSelection {
	return {
		selected: props.selectedInvites?.has(invite.inviteId) ?? false,
		count: props.selectedInvites?.size ?? 0,
		bulk: {
			label: t("members.table.actions.cancelSelected"),
			icon: Trash2,
			count: props.selectedInvites?.size ?? 0,
			select: () => emit("cancelSelected"),
		},
	};
}

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
          <DataTableHead class="min-w-[280px]">
            {{ t("members.table.headers.invite") }}
          </DataTableHead>
          <DataTableHead class="w-[140px]">
            {{ t("members.table.headers.role") }}
          </DataTableHead>
          <DataTableHead class="w-[160px]">
            {{ t("members.table.headers.invited") }}
          </DataTableHead>
          <DataTableHead class="w-[160px]">
            {{ t("members.table.headers.expires") }}
          </DataTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <RowActions
          v-for="invite in invites"
          :key="invite.inviteId"
          :actions="rowActions(invite)"
          :selection="rowSelection(invite)"
        >
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
                  >{{ relativeTime(invite.createdAt) }}</span
                >
              </TableCell>
              <TableCell>
                <span
                  class="text-xs font-normal text-neutral-600 dark:text-neutral-400"
                  >{{ relativeTimeFuture(invite.expiresAt) }}</span
                >
              </TableCell>
            </TableRow>
          </RowActions>
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
