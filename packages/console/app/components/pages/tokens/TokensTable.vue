<script setup lang="ts">
import type { ApiToken } from "@nvisy/sdk/datatypes";
import type {
	RowAction,
	RowSelection,
} from "#console/components/pages/RowActions.vue";
import { Trash2, Edit, Key } from "@lucide/vue";
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
import { Checkbox } from "#console/components/ui/checkbox";
import { Badge } from "#console/components/ui/badge";

// Helper to truncate UUID for display
const truncateId = (id: string): string => id.slice(0, 8);

interface Props {
	tokens: ApiToken[];
	selectedTokens: Set<string>;
	allSelected: boolean;
	currentTokenId?: string | null;
}

interface Emits {
	(e: "toggleSelectAll"): void;
	(e: "toggleToken", tokenId: string): void;
	(e: "deleteToken", token: ApiToken): void;
	(e: "deleteSelected"): void;
	(e: "renameToken", token: ApiToken): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();
const { relativeTime } = useRelativeTime();

// Helper functions
const isTokenSelected = (tokenId: string): boolean =>
	props.selectedTokens.has(tokenId);

const isCurrentToken = (tokenId: string): boolean =>
	props.currentTokenId === tokenId;

const canSelectToken = (token: ApiToken): boolean => !isCurrentToken(token.id);

const isTokenExpired = (token: ApiToken): boolean => {
	if (!token.expiredAt) return false;
	return new Date(token.expiredAt) < new Date();
};

function handleRowClick(token: ApiToken) {
	if (canSelectToken(token)) {
		emit("toggleToken", token.id);
	}
}

const formatDate = (date: string | null | undefined): string => {
	if (!date) return t("tokens.table.info.never");
	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "2-digit",
	}).format(new Date(date));
};

const getSessionTypeColor = (type: string): string => {
	const colors: Record<string, string> = {
		web: "bg-blue-500",
		api: "bg-purple-500",
		cli: "bg-orange-500",
	};
	return colors[type.toLowerCase()] || "bg-neutral-500";
};

const getSessionTypeInitial = (type: string): string => {
	const initials: Record<string, string> = {
		web: "W",
		api: "A",
		cli: "C",
	};
	return initials[type.toLowerCase()] || "T";
};

/**
 * Per-row menu: rename (API tokens only, otherwise a disabled hint) then revoke
 * (disabled for the current session's own token).
 */
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

/** Selection state for a row, driving the bulk-vs-single menu. */
function rowSelection(token: ApiToken): RowSelection {
	return {
		selected: props.selectedTokens.has(token.id),
		count: props.selectedTokens.size,
		bulk: {
			label: t("tokens.table.actions.revokeSelected"),
			icon: Trash2,
			count: props.selectedTokens.size,
			select: () => emit("deleteSelected"),
		},
	};
}
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="w-[50px]">
          <Checkbox
            :model-value="allSelected"
            @update:model-value="emit('toggleSelectAll')"
          />
        </TableHead>
        <DataTableHead>{{ t("tokens.table.headers.name") }}</DataTableHead>
        <DataTableHead>{{ t("tokens.table.headers.createdAt") }}</DataTableHead>
        <DataTableHead>{{ t("tokens.table.headers.lastUsed") }}</DataTableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <RowActions
        v-for="token in tokens"
        :key="token.id"
        :actions="rowActions(token)"
        :selection="rowSelection(token)"
      >
        <TableRow
          :class="[
            'border-b border-neutral-200 dark:border-neutral-800',
            canSelectToken(token) ? 'cursor-pointer' : 'cursor-default',
          ]"
          @click="handleRowClick(token)"
        >
            <TableCell @click.stop>
              <Checkbox
                :model-value="isTokenSelected(token.id)"
                :disabled="isCurrentToken(token.id)"
                @update:model-value="emit('toggleToken', token.id)"
              />
            </TableCell>
            <TableCell class="font-normal">
              <div class="flex items-center gap-3">
                <!-- Token Icon with Session Type Badge -->
                <div class="relative">
                  <div
                    class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0"
                  >
                    <Key :size="20" class="text-white" />
                  </div>
                  <!-- Session Type Badge -->
                  <div
                    :class="[
                      'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900',
                      getSessionTypeColor(token.sessionType),
                    ]"
                  >
                    <span class="text-white text-[8px] font-bold">
                      {{ getSessionTypeInitial(token.sessionType) }}
                    </span>
                  </div>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span>{{ token.displayName }}</span>
                    <Badge
                      v-if="isCurrentToken(token.id)"
                      variant="secondary"
                      class="text-xs"
                    >
                      {{ t("tokens.table.badges.current") }}
                    </Badge>
                    <Badge
                      v-else-if="isTokenExpired(token)"
                      variant="destructive"
                      class="text-xs"
                    >
                      {{ t("tokens.table.badges.expired") }}
                    </Badge>
                  </div>
                  <div
                    class="text-xs text-neutral-500 dark:text-neutral-400 mt-1"
                  >
                    <span class="font-mono">{{ truncateId(token.id) }}</span>
                    <span class="mx-1">·</span>
                    {{ t("tokens.table.info.expires") }}
                    {{ formatDate(token.expiredAt) }}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell
              class="font-normal text-neutral-600 dark:text-neutral-400"
            >
              {{ relativeTime(token.issuedAt) }}
            </TableCell>
            <TableCell
              class="font-normal text-neutral-600 dark:text-neutral-400"
            >
              {{ relativeTime(token.lastUsedAt) }}
            </TableCell>
          </TableRow>
        </RowActions>
    </TableBody>
  </Table>
</template>
