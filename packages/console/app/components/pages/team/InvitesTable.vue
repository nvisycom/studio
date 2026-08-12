<script setup lang="ts">
import type { Invite } from "@nvisy/sdk/datatypes";
import type {
	RowAction,
	BulkAction,
} from "#console/components/pages/RowActions.vue";
import type { Selection } from "#console/composables/useSelection";
import type { VirtualColumn } from "#console/components/ui/virtual-table";
import { Mail, X, Copy, Trash2 } from "@lucide/vue";
import { toast } from "vue-sonner";
import { VirtualTable } from "#console/components/ui/virtual-table";

interface Props {
	invites: Invite[];
	selection: Selection;
}

interface Emits {
	(e: "cancel", inviteId: string): void;
	(e: "cancelSelected"): void;
}

// The table keys rows by id; invites are keyed by inviteId, so expose it as id.
type InviteRow = Invite & { id: string };

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const { relativeTime, relativeTimeFuture } = useRelativeTime();

const rows = computed<InviteRow[]>(() =>
	props.invites.map((i) => ({ ...i, id: i.inviteId })),
);

function inviteCode(invite: Invite): string {
	return invite.inviteToken ? `${invite.inviteToken.slice(0, 8)}...` : "";
}

const columns = computed<VirtualColumn<InviteRow>[]>(() => [
	{
		key: "invite",
		header: t("members.table.headers.invite"),
		cell: (i) => ({
			type: "avatar",
			name: i.inviteeEmail || inviteCode(i),
			mono: !i.inviteeEmail,
			subtitle: i.inviteeEmail
				? t("members.table.status.emailInvite")
				: t("members.table.status.linkInvite"),
		}),
	},
	{
		key: "role",
		header: t("members.table.headers.role"),
		width: "140px",
		cell: (i) => ({
			type: "badge",
			label: t(`members.roles.${i.invitedRole}`),
			capitalize: true,
		}),
	},
	{
		key: "invited",
		header: t("members.table.headers.invited"),
		width: "160px",
		cell: (i) => ({
			type: "text",
			value: relativeTime(i.createdAt),
			muted: true,
		}),
	},
	{
		key: "expires",
		header: t("members.table.headers.expires"),
		width: "160px",
		cell: (i) => ({
			type: "text",
			value: relativeTimeFuture(i.expiresAt),
			muted: true,
		}),
	},
]);

/** Copy link (only when the invite has a token), then cancel. */
function rowActions(invite: InviteRow): RowAction[] {
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

function bulkAction(selected: Set<string>): BulkAction {
	return {
		label: t("members.table.actions.cancelSelected"),
		icon: Trash2,
		count: selected.size,
		select: () => emit("cancelSelected"),
	};
}

async function copyInviteLink(invite: Invite) {
	if (!invite.inviteToken) return;
	try {
		await navigator.clipboard.writeText(
			`${window.location.origin}/join/${invite.inviteToken}`,
		);
		toast.success(t("members.messages.linkCopied"));
	} catch {
		toast.error(t("members.errors.linkCopyFailed"));
	}
}
</script>

<template>
  <VirtualTable
    :rows="rows"
    :columns="columns"
    :selection="selection"
    :row-actions="rowActions"
    :bulk-action="bulkAction"
    :empty="{
      icon: Mail,
      title: t('members.table.empty.noPendingInvites'),
      description: t('members.table.empty.noPendingInvitesDescription'),
    }"
  />
</template>
