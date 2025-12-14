<script setup lang="ts">
import { MoreHorizontal, Trash2, Globe, Edit } from "lucide-vue-next";
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

interface Token {
  id: string;
  name: string;
  service: string;
  browser: string;
  os: string;
  authMethod: string;
  scope: string[];
  createdAt: Date;
  expiresAt: Date | null;
  lastUsed: Date | null;
  token?: string;
}

interface Props {
  tokens: Token[];
  selectedTokens: Set<string>;
  allSelected: boolean;
}

interface Emits {
  (e: "toggleSelectAll"): void;
  (e: "toggleToken", tokenId: string): void;
  (e: "deleteToken", token: Token): void;
  (e: "deleteSelected"): void;
  (e: "renameToken", token: Token): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Helper functions
const isTokenSelected = (tokenId: string): boolean =>
  props.selectedTokens.has(tokenId);

const formatDate = (date: Date | null): string => {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
};

const getAuthMethodColor = (method: string): string => {
  const colors: Record<string, string> = {
    oauth: "bg-blue-500",
    "api key": "bg-green-500",
    token: "bg-purple-500",
  };
  return colors[method.toLowerCase()] || "bg-neutral-500";
};

const getAuthMethodInitial = (method: string): string => {
  const initials: Record<string, string> = {
    OAuth: "O",
    "API Key": "K",
    Token: "T",
  };
  return initials[method] || "T";
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
                Delete Selected{{
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
            <!-- Service Icon with Auth Method Badge -->
            <div class="relative">
              <div
                class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0"
              >
                <Globe :size="20" class="text-white" />
              </div>
              <!-- Auth Method Badge -->
              <div
                :class="[
                  'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900',
                  getAuthMethodColor(token.authMethod),
                ]"
                :title="token.authMethod"
              >
                <span class="text-white text-[8px] font-bold">
                  {{ getAuthMethodInitial(token.authMethod) }}
                </span>
              </div>
            </div>
            <div>
              <div>{{ token.name }}</div>
              <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Created {{ formatDate(token.createdAt) }} · Expires
                {{ formatDate(token.expiresAt) }}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell class="text-neutral-600 dark:text-neutral-400">
          {{ formatDate(token.lastUsed) }}
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
                v-if="token.authMethod === 'API Key'"
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
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
