<script setup lang="ts">
import type { Member } from "@nvisy/sdk/datatypes";
import type {
	RowAction,
	RowSelection,
} from "#console/components/pages/RowActions.vue";
import type { Selection } from "#console/composables/useSelection";
import { Users, Trash2, UserCog } from "@lucide/vue";
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
              'group border-b border-border/50',
              canSelectMember(member) ? 'cursor-pointer' : 'cursor-default',
            ]"
            @click="handleRowClick(member)"
          >
              <TableCell @click.stop>
                <Checkbox
                  :model-value="selection.selected.value.has(member.username)"
                  @update:model-value="selection.toggle(member.username)"
                  :disabled="!canSelectMember(member)"
                />
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-3">
                  <EntityAvatar
                    :name="memberLabel(member)"
                    :src="memberAvatar(member)"
                    size="md"
                  />
                  <div class="min-w-0">
                    <p class="truncate font-medium text-foreground">
                      {{ memberLabel(member) }}
                    </p>
                    <p class="truncate text-xs text-muted-foreground">
                      {{ member.emailAddress }}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" class="font-normal capitalize">
                  {{ t(`members.roles.${member.memberRole}`) }}
                </Badge>
              </TableCell>
              <TableCell>
                <span
                  :class="[
                    'text-xs',
                    member.has2fa
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-muted-foreground',
                  ]"
                >
                  {{
                    member.has2fa
                      ? t("members.table.status.enabled")
                      : t("members.table.status.disabled")
                  }}
                </span>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {{ relativeTime(member.createdAt) }}
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
        <Users class="size-5 text-muted-foreground" />
      </div>
      <p class="mb-1 text-sm text-foreground">
        {{ t("members.table.empty.noMembers") }}
      </p>
      <p class="text-xs text-muted-foreground">
        {{ t("members.table.empty.noMembersDescription") }}
      </p>
    </div>
  </div>
</template>
