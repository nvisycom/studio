<script setup lang="ts">
import type { Member } from "@nvisy/sdk/datatypes";
import type {
	RowAction,
	BulkAction,
} from "#console/components/pages/RowActions.vue";
import type { Selection } from "#console/composables/useSelection";
import type { VirtualColumn } from "#console/components/ui/virtual-table";
import { Users, Trash2, UserCog } from "@lucide/vue";
import { VirtualTable } from "#console/components/ui/virtual-table";
import { personLabel } from "#console/utils/naming";

interface Props {
	members: Member[];
	selection: Selection;
}

interface Emits {
	(e: "remove", memberId: string): void;
	(e: "edit", memberId: string): void;
	(e: "deleteSelected"): void;
}

// The table keys rows by id; members are keyed by username, so expose it as id.
type MemberRow = Member & { id: string };

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const { relativeTime } = useRelativeTime();
const { resolveAvatarUrl } = useAvatarUrl();

const rows = computed<MemberRow[]>(() =>
	props.members.map((m) => ({ ...m, id: m.username })),
);

// The owner can't be selected or acted on.
const isSelectable = (member: MemberRow) => member.memberRole !== "owner";

const columns = computed<VirtualColumn<MemberRow>[]>(() => [
	{
		key: "member",
		header: t("members.table.headers.member"),
		cell: (m) => ({
			type: "avatar",
			name: personLabel(m),
			src: resolveAvatarUrl(m.avatarUrl),
			size: "md",
			subtitle: m.emailAddress,
		}),
	},
	{
		key: "role",
		header: t("members.table.headers.role"),
		width: "140px",
		cell: (m) => ({
			type: "badge",
			label: t(`members.roles.${m.memberRole}`),
			capitalize: true,
		}),
	},
	{
		key: "twoFA",
		header: t("members.table.headers.twoFA"),
		width: "160px",
		cell: () => ({ type: "custom" }),
	},
	{
		key: "joined",
		header: t("members.table.headers.joined"),
		width: "160px",
		cell: (m) => ({
			type: "text",
			value: relativeTime(m.createdAt),
			muted: true,
		}),
	},
]);

/** Edit + remove, both disabled for the owner. */
function rowActions(member: MemberRow): RowAction[] {
	const disabled = !isSelectable(member);
	return [
		{
			key: "edit",
			label: t("members.table.actions.edit"),
			icon: UserCog,
			disabled,
			select: () => emit("edit", member.username),
		},
		{
			key: "remove",
			label: t("members.table.actions.delete"),
			icon: Trash2,
			danger: true,
			disabled,
			separatorBefore: true,
			select: () => emit("remove", member.username),
		},
	];
}

function bulkAction(selected: Set<string>): BulkAction {
	return {
		label: t("members.table.actions.deleteSelected"),
		icon: Trash2,
		count: selected.size,
		select: () => emit("deleteSelected"),
	};
}
</script>

<template>
  <VirtualTable
    :rows="rows"
    :columns="columns"
    :selection="selection"
    :is-selectable="isSelectable"
    :row-actions="rowActions"
    :bulk-action="bulkAction"
    :empty="{
      icon: Users,
      title: t('members.table.empty.noMembers'),
      description: t('members.table.empty.noMembersDescription'),
    }"
  >
    <template #cell-twoFA="{ row }">
      <span
        :class="[
          'text-xs',
          row.has2fa
            ? 'text-green-600 dark:text-green-400'
            : 'text-muted-foreground',
        ]"
      >
        {{
          row.has2fa
            ? t("members.table.status.enabled")
            : t("members.table.status.disabled")
        }}
      </span>
    </template>
  </VirtualTable>
</template>
