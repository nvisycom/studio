<script setup lang="ts">
import type { ApiToken } from "@nvisy/sdk";
import { MoreHorizontal, Trash2, Edit, Key } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// Helper to truncate UUID for display
const truncateId = (id: string): string => id.slice(0, 8);

interface Props {
  tokens: ApiToken[];
  selectedTokens: Set<string>;
  allSelected: boolean;
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

// Helper functions
const isTokenSelected = (tokenId: string): boolean =>
  props.selectedTokens.has(tokenId);

const formatDate = (date: string | null | undefined): string => {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(date));
};

const getSessionTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    web: "bg-blue-500",
    mobile: "bg-green-500",
    api: "bg-purple-500",
    cli: "bg-orange-500",
  };
  return colors[type.toLowerCase()] || "bg-neutral-500";
};

const getSessionTypeInitial = (type: string): string => {
  const initials: Record<string, string> = {
    web: "W",
    mobile: "M",
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
        <TableHead>Name</TableHead>
        <TableHead>Last Used</TableHead>
        <TableHead class="w-[50px]">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="sm"
                :disabled="selectedTokens.size === 0"
              >
                <MoreHorizontal :size="16" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                @click="emit('deleteSelected')"
                class="text-red-600 dark:text-red-400"
                :disabled="selectedTokens.size === 0"
              >
                <Trash2 :size="16" class="mr-2" />
                Revoke Selected{{
                  selectedTokens.size > 0 ? ` (${selectedTokens.size})` : ""
                }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="token in tokens" :key="token.id">
        <TableCell>
          <Checkbox
            :model-value="isTokenSelected(token.id)"
            @update:model-value="emit('toggleToken', token.id)"
          />
        </TableCell>
        <TableCell class="font-medium">
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
                :title="token.sessionType"
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
                  v-if="token.isExpired"
                  variant="destructive"
                  class="text-xs"
                >
                  Expired
                </Badge>
              </div>
              <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                <span class="font-mono">{{ truncateId(token.id) }}</span>
                <span class="mx-1">·</span>
                Created {{ formatDate(token.issuedAt) }}
                <span class="mx-1">·</span>
                Expires {{ formatDate(token.expiredAt) }}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell class="text-neutral-600 dark:text-neutral-400">
          {{ formatDate(token.lastUsedAt) }}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm">
                <MoreHorizontal :size="16" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                v-if="token.sessionType === 'api'"
                @click="emit('renameToken', token)"
              >
                <Edit :size="16" class="mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                @click="emit('deleteToken', token)"
                class="text-red-600 dark:text-red-400"
              >
                <Trash2 :size="16" class="mr-2" />
                Revoke
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
