<script setup lang="ts">
import type { Member } from "@nvisy/sdk/datatypes";
import type {
	RowAction,
	RowSelection,
} from "#console/components/pages/RowActions.vue";
import type { Selection } from "#console/composables/useSelection";
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
import DataTableHead from "#console/components/pages/DataTableHead.vue";
import RowActions from "#console/components/pages/RowActions.vue";
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

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const { relativeTime } = useRelativeTime();
const { resolveAvatarUrl } = useAvatarUrl();

function memberAvatar(member: Member): string | undefined {
	return resolveAvatarUrl(member.avatarUrl);
}

function memberLabel(member: Member): string {
	return personLabel(member);
}

function canSelectMember(member: Member): boolean {
	return member.memberRole !== "owner";
}

function handleRowClick(member: Member) {
	if (canSelectMember(member)) {
		props.selection.toggle(member.username);
	}
}

/** Per-row menu: edit + remove, both disabled for the owner. */
function rowActions(member: Member): RowAction[] {
	const disabled = !canSelectMember(member);
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

/** Selection state for a row, driving the bulk-vs-single menu. */
function rowSelection(member: Member): RowSelection {
	const selected = props.selection.selected.value;
	return {
		selected: selected.has(member.username),
		count: selected.size,
		bulk: {
			label: t("members.table.actions.deleteSelected"),
			icon: Trash2,
			count: selected.size,
			select: () => emit("deleteSelected"),
		},
	};
}
</script>

<template>
  <div v-if="members.length > 0">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="w-[50px]">
            <Checkbox
              :model-value="selection.allSelected.value"
              @update:model-value="selection.toggleAll()"
              class="border-neutral-400 dark:border-neutral-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </TableHead>
          <DataTableHead class="min-w-[280px]">
            {{ t("members.table.headers.member") }}
          </DataTableHead>
          <DataTableHead class="w-[140px]">
            {{ t("members.table.headers.role") }}
          </DataTableHead>
          <DataTableHead class="w-[160px]">
            {{ t("members.table.headers.twoFA") }}
          </DataTableHead>
          <DataTableHead class="w-[160px]">
            {{ t("members.table.headers.joined") }}
          </DataTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <RowActions
          v-for="member in members"
          :key="member.username"
          :actions="rowActions(member)"
          :selection="rowSelection(member)"
        >
          <TableRow
            :class="[
              'border-b border-neutral-200 dark:border-neutral-800',
              canSelectMember(member) ? 'cursor-pointer' : 'cursor-default',
            ]"
            @click="handleRowClick(member)"
          >
              <TableCell @click.stop>
                <Checkbox
                  :model-value="selection.selected.value.has(member.username)"
                  @update:model-value="selection.toggle(member.username)"
                  :disabled="!canSelectMember(member)"
                  class="border-neutral-400 dark:border-neutral-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-3">
                  <EntityAvatar
                    :name="memberLabel(member)"
                    :src="memberAvatar(member)"
                    size="md"
                  />
                  <div>
                    <p class="font-normal text-neutral-900 dark:text-white">
                      {{ memberLabel(member) }}
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
                  >{{ relativeTime(member.createdAt) }}</span
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
