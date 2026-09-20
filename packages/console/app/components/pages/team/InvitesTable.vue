<script setup lang="ts">
import type { WorkspaceInvite } from "@nvisy/sdk/datatypes";
import type {
	RowAction,
	BulkAction,
} from "#console/components/pages/RowActions.vue";
import type { Selection } from "#console/composables/useSelection";
import type { VirtualColumn } from "#console/components/ui/virtual-table";
import { Mail, X, Trash2 } from "@lucide/vue";
import { VirtualTable } from "#console/components/ui/virtual-table";

interface Props {
	invites: WorkspaceInvite[];
	selection: Selection;
}

interface Emits {
	(e: "cancel", inviteId: string): void;
	(e: "cancelSelected"): void;
}

// The table keys rows by id; invites are keyed by inviteId, so expose it as id.
type InviteRow = WorkspaceInvite & { id: string };

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const { relativeTime, relativeTimeFuture } = useRelativeTime();

const rows = computed<InviteRow[]>(() =>
	props.invites.map((i) => ({ ...i, id: i.inviteId })),
);

const columns = computed<VirtualColumn<InviteRow>[]>(() => [
	{
		key: "invite",
		header: t("members.table.headers.invite"),
		cell: (i) => ({
			type: "avatar",
			name: i.inviteeEmail || t("members.table.openInvite"),
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

function rowActions(invite: InviteRow): RowAction[] {
	return [
		{
			key: "cancel",
			label: t("members.table.actions.cancel"),
			icon: X,
			danger: true,
			select: () => emit("cancel", invite.inviteId),
		},
	];
}

function bulkAction(selected: Set<string>): BulkAction {
	return {
		label: t("members.table.actions.cancelSelected"),
		icon: Trash2,
		count: selected.size,
		select: () => emit("cancelSelected"),
	};
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
