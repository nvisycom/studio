<script setup lang="ts">
import type { Invite } from "@nvisy/sdk/datatypes";
import type {
	RowAction,
	RowSelection,
} from "#console/components/pages/RowActions.vue";
import type { Selection } from "#console/composables/useSelection";
import { Mail, X, Copy, Trash2 } from "@lucide/vue";
import { toast } from "vue-sonner";
import { EntityAvatar } from "#console/components/common";
import { Badge } from "#console/components/ui/badge";
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
	selection: Selection;
}

interface Emits {
	(e: "cancel", inviteId: string): void;
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
	const selected = props.selection.selected.value;
	return {
		selected: selected.has(invite.inviteId),
		count: selected.size,
		bulk: {
			label: t("members.table.actions.cancelSelected"),
			icon: Trash2,
			count: selected.size,
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
              :model-value="selection.allSelected.value"
              @update:model-value="selection.toggleAll()"
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
            class="group cursor-pointer border-b border-border/50"
            @click="selection.toggle(invite.inviteId)"
          >
              <TableCell @click.stop>
                <Checkbox
                  :model-value="selection.selected.value.has(invite.inviteId)"
                  @update:model-value="selection.toggle(invite.inviteId)"
                />
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-3">
                  <EntityAvatar
                    :name="invite.inviteeEmail || getInviteCode(invite)"
                    size="md"
                  />
                  <div class="min-w-0">
                    <p
                      v-if="invite.inviteeEmail"
                      class="truncate font-medium text-foreground"
                    >
                      {{ invite.inviteeEmail }}
                    </p>
                    <p
                      v-else
                      class="truncate font-mono font-medium text-foreground"
                    >
                      {{ getInviteCode(invite) }}
                    </p>
                    <p class="truncate text-xs text-muted-foreground">
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
                <Badge variant="secondary" class="font-normal capitalize">
                  {{ t(`members.roles.${invite.invitedRole}`) }}
                </Badge>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {{ relativeTime(invite.createdAt) }}
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {{ relativeTimeFuture(invite.expiresAt) }}
              </TableCell>
            </TableRow>
          </RowActions>
      </TableBody>
    </Table>
  </div>
  <div v-else class="py-12">
    <div class="text-center">
      <div
        class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
      >
        <Mail class="size-5 text-muted-foreground" />
      </div>
      <p class="mb-1 text-sm text-foreground">
        {{ t("members.table.empty.noPendingInvites") }}
      </p>
      <p class="text-xs text-muted-foreground">
        {{ t("members.table.empty.noPendingInvitesDescription") }}
      </p>
    </div>
  </div>
</template>
