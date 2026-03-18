<script setup lang="ts">
import type { ApiToken } from "@nvisy/sdk/datatypes";
import { Trash2, Edit, Key } from "lucide-vue-next";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, formatRelativeTimeFuture } from "@/utils/date";

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
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("tokens.table.headers.name")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("tokens.table.headers.createdAt")
        }}</TableHead>
        <TableHead class="uppercase text-xs font-normal tracking-wider">{{
          t("tokens.table.headers.lastUsed")
        }}</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <ContextMenu v-for="token in tokens" :key="token.id">
        <ContextMenuTrigger as-child>
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
                    <span>{{ token.name }}</span>
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
              {{ formatRelativeTime(token.issuedAt, t) }}
            </TableCell>
            <TableCell
              class="font-normal text-neutral-600 dark:text-neutral-400"
            >
              {{ formatRelativeTime(token.lastUsedAt, t) }}
            </TableCell>
          </TableRow>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <!-- Bulk actions when token is selected -->
          <template v-if="isTokenSelected(token.id) && selectedTokens.size > 1">
            <ContextMenuItem
              class="text-red-600 dark:text-red-400 cursor-pointer"
              @click="emit('deleteSelected')"
            >
              <Trash2 :size="14" class="mr-2" />
              {{ t("tokens.table.actions.revokeSelected") }} ({{
                selectedTokens.size
              }})
            </ContextMenuItem>
          </template>
          <!-- Single token actions -->
          <template v-else>
            <ContextMenuItem
              v-if="token.sessionType === 'api'"
              class="cursor-pointer"
              @click="emit('renameToken', token)"
            >
              <Edit :size="14" class="mr-2" />
              {{ t("tokens.table.actions.rename") }}
            </ContextMenuItem>
            <ContextMenuItem
              v-else
              disabled
              class="text-neutral-400 cursor-not-allowed"
            >
              <Edit :size="14" class="mr-2" />
              {{ t("tokens.table.actions.cannotRename") }}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              v-if="!isCurrentToken(token.id)"
              class="text-red-600 dark:text-red-400 cursor-pointer"
              @click="emit('deleteToken', token)"
            >
              <Trash2 :size="14" class="mr-2" />
              {{ t("tokens.table.actions.revoke") }}
            </ContextMenuItem>
            <ContextMenuItem
              v-else
              disabled
              class="text-neutral-400 cursor-not-allowed"
            >
              <Trash2 :size="14" class="mr-2" />
              {{ t("tokens.table.actions.cannotRevoke") }}
            </ContextMenuItem>
          </template>
        </ContextMenuContent>
      </ContextMenu>
    </TableBody>
  </Table>
</template>
