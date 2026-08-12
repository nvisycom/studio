<script setup lang="ts">
import type { ApiToken } from "@nvisy/sdk/datatypes";
import type {
	RowAction,
	BulkAction,
} from "#console/components/pages/RowActions.vue";
import type { Selection } from "#console/composables/useSelection";
import type { VirtualColumn } from "#console/components/ui/virtual-table";
import { Trash2, Edit, Key } from "@lucide/vue";
import { VirtualTable } from "#console/components/ui/virtual-table";
import { Badge } from "#console/components/ui/badge";

interface Props {
	tokens: ApiToken[];
	selection: Selection;
	currentTokenId?: string | null;
}

interface Emits {
	(e: "deleteToken", token: ApiToken): void;
	(e: "deleteSelected"): void;
	(e: "renameToken", token: ApiToken): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const { relativeTime } = useRelativeTime();

const truncateId = (id: string) => id.slice(0, 8);
const isCurrentToken = (id: string) => props.currentTokenId === id;
const isSelectable = (token: ApiToken) => !isCurrentToken(token.id);

const isTokenExpired = (token: ApiToken): boolean =>
	!!token.expiredAt && new Date(token.expiredAt) < new Date();

// Session-type accent shown on the token icon overlay.
const SESSION_TYPE_COLOR: Record<string, string> = {
	web: "bg-blue-500",
	api: "bg-purple-500",
	cli: "bg-orange-500",
};
const sessionColor = (type: string) =>
	SESSION_TYPE_COLOR[type.toLowerCase()] ?? "bg-muted-foreground";
const sessionInitial = (type: string) =>
	({ web: "W", api: "A", cli: "C" })[type.toLowerCase()] ?? "T";

const formatExpiry = (date: string | null | undefined): string => {
	if (!date) return t("tokens.table.info.never");
	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "2-digit",
	}).format(new Date(date));
};

const columns = computed<VirtualColumn<ApiToken>[]>(() => [
	{
		key: "name",
		header: t("tokens.table.headers.name"),
		cell: () => ({ type: "custom" }),
	},
	{
		key: "createdAt",
		header: t("tokens.table.headers.createdAt"),
		width: "160px",
		cell: (tk) => ({
			type: "text",
			value: relativeTime(tk.issuedAt),
			muted: true,
		}),
	},
	{
		key: "lastUsed",
		header: t("tokens.table.headers.lastUsed"),
		width: "160px",
		cell: (tk) => ({
			type: "text",
			value: relativeTime(tk.lastUsedAt),
			muted: true,
		}),
	},
]);

/** Rename (API tokens only) then revoke (disabled for the current token). */
function rowActions(token: ApiToken): RowAction[] {
	const isApi = token.sessionType === "api";
	const isCurrent = isCurrentToken(token.id);
	return [
		{
			key: "rename",
			label: isApi
				? t("tokens.table.actions.rename")
				: t("tokens.table.actions.cannotRename"),
			icon: Edit,
			disabled: !isApi,
			select: () => emit("renameToken", token),
		},
		{
			key: "revoke",
			label: isCurrent
				? t("tokens.table.actions.cannotRevoke")
				: t("tokens.table.actions.revoke"),
			icon: Trash2,
			danger: !isCurrent,
			disabled: isCurrent,
			separatorBefore: true,
			select: () => emit("deleteToken", token),
		},
	];
}

function bulkAction(selected: Set<string>): BulkAction {
	return {
		label: t("tokens.table.actions.revokeSelected"),
		icon: Trash2,
		count: selected.size,
		select: () => emit("deleteSelected"),
	};
}
</script>

<template>
  <VirtualTable
    :rows="tokens"
    :columns="columns"
    :selection="selection"
    :is-selectable="isSelectable"
    :row-actions="rowActions"
    :bulk-action="bulkAction"
    :row-height="64"
  >
    <template #cell-name="{ row }">
      <div class="flex items-center gap-3">
        <!-- Token icon with a session-type accent overlay -->
        <div class="relative shrink-0">
          <div
            class="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600"
          >
            <Key :size="20" class="text-white" />
          </div>
          <div
            :class="[
              'absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-background',
              sessionColor(row.sessionType),
            ]"
          >
            <span class="text-[8px] font-bold text-white">
              {{ sessionInitial(row.sessionType) }}
            </span>
          </div>
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="truncate text-foreground">{{ row.displayName }}</span>
            <Badge v-if="isCurrentToken(row.id)" variant="secondary" class="text-xs">
              {{ t("tokens.table.badges.current") }}
            </Badge>
            <Badge
              v-else-if="isTokenExpired(row)"
              variant="destructive"
              class="text-xs"
            >
              {{ t("tokens.table.badges.expired") }}
            </Badge>
          </div>
          <div class="mt-1 text-xs text-muted-foreground">
            <span class="font-mono">{{ truncateId(row.id) }}</span>
            <span class="mx-1">·</span>
            {{ t("tokens.table.info.expires") }} {{ formatExpiry(row.expiredAt) }}
          </div>
        </div>
      </div>
    </template>
  </VirtualTable>
</template>
