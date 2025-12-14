<script setup lang="ts">
import { ref, computed } from "vue";
import {
	Key,
	Copy,
	Check,
	ChevronDown,
	MoreHorizontal,
	Trash2,
	Calendar,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
	Empty,
	EmptyHeader,
	EmptyTitle,
	EmptyDescription,
} from "@/components/ui/empty";
import {
	TokensTable,
	TokenCreatedModal,
	DeleteTokenModal,
	DeleteMultipleTokensModal,
	RenameTokenModal,
} from "@/components/tokens";

definePageMeta({
	pageName: "Tokens",
});

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

// Form state
const tokenName = ref("");
const tokenExpiration = ref("90");

// Modal state
const newTokenGenerated = ref<string | null>(null);
const isTokenCreatedModalOpen = ref(false);
const tokenToDelete = ref<Token | null>(null);
const isDeleteDialogOpen = ref(false);
const isDeleteMultipleDialogOpen = ref(false);
const tokenToRename = ref<Token | null>(null);
const isRenameDialogOpen = ref(false);

// Selection state
const selectedTokens = ref<Set<string>>(new Set());
const copiedTokenId = ref<string | null>(null);

// Constants
const expirations = [
	{ label: "30 days", value: "30" },
	{ label: "90 days", value: "90" },
	{ label: "1 year", value: "365" },
	{ label: "Never", value: "never" },
] as const;

// Mock data
const tokens = ref<Token[]>([
	{
		id: "1",
		name: "Nvisy from Chrome on Windows",
		service: "Nvisy",
		browser: "Chrome",
		os: "Windows",
		authMethod: "OAuth",
		scope: ["read", "write"],
		createdAt: new Date("2024-01-15"),
		expiresAt: new Date("2025-01-15"),
		lastUsed: new Date("2024-10-10"),
		token: "nvisy_prod_abc123def456",
	},
	{
		id: "2",
		name: "Nvisy from Safari on Mac OS",
		service: "Nvisy",
		browser: "Safari",
		os: "Mac OS",
		authMethod: "API Key",
		scope: ["read", "write", "admin"],
		createdAt: new Date("2024-03-20"),
		expiresAt: null,
		lastUsed: new Date("2024-10-11"),
		token: "nvisy_cicd_xyz789ghi012",
	},
	{
		id: "3",
		name: "Nvisy from Firefox on Linux",
		service: "Nvisy",
		browser: "Firefox",
		os: "Linux",
		authMethod: "OAuth",
		scope: ["read"],
		createdAt: new Date("2024-08-05"),
		expiresAt: new Date("2024-11-05"),
		lastUsed: null,
		token: "nvisy_dev_jkl345mno678",
	},
]);

// Token creation
function createToken() {
	if (!tokenName.value.trim()) return;

	const expiresAt =
		tokenExpiration.value === "never"
			? null
			: new Date(
					Date.now() +
						Number.parseInt(tokenExpiration.value) * 24 * 60 * 60 * 1000,
				);

	const newToken: Token = {
		id: Date.now().toString(),
		name: tokenName.value,
		service: "Nvisy",
		browser: "Chrome",
		os: "Mac OS",
		authMethod: "API Key",
		scope: ["read", "write"],
		createdAt: new Date(),
		expiresAt,
		lastUsed: null,
		token: `nvisy_${Math.random().toString(36).substring(2)}`,
	};

	tokens.value.unshift(newToken);
	newTokenGenerated.value = newToken.token || null;
	isTokenCreatedModalOpen.value = true;

	// Reset form
	tokenName.value = "";
	tokenExpiration.value = "90";
}

function closeTokenCreatedModal() {
	isTokenCreatedModalOpen.value = false;
	newTokenGenerated.value = null;
}

// Token deletion
function openDeleteDialog(token: Token) {
	tokenToDelete.value = token;
	isDeleteDialogOpen.value = true;
}

function deleteToken() {
	if (!tokenToDelete.value) return;

	tokens.value = tokens.value.filter((t) => t.id !== tokenToDelete.value?.id);
	isDeleteDialogOpen.value = false;
	tokenToDelete.value = null;
}

function openDeleteMultipleDialog() {
	isDeleteMultipleDialogOpen.value = true;
}

function deleteSelectedTokens() {
	tokens.value = tokens.value.filter((t) => !selectedTokens.value.has(t.id));
	selectedTokens.value = new Set();
	isDeleteMultipleDialogOpen.value = false;
}

// Clipboard
async function copyToken(token: string, tokenId: string) {
	try {
		await navigator.clipboard.writeText(token);
		copiedTokenId.value = tokenId;
		setTimeout(() => {
			copiedTokenId.value = null;
		}, 2000);
	} catch (err) {
		console.error("Failed to copy token:", err);
	}
}

// Computed
const allSelected = computed(
	() =>
		tokens.value.length > 0 &&
		selectedTokens.value.size === tokens.value.length,
);

// Utilities
function formatDate(date: Date | null): string {
	if (!date) return "Never";
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
}

function toggleSelectAll() {
	selectedTokens.value = allSelected.value
		? new Set()
		: new Set(tokens.value.map((t) => t.id));
}

function toggleToken(tokenId: string) {
	const newSet = new Set(selectedTokens.value);
	newSet.has(tokenId) ? newSet.delete(tokenId) : newSet.add(tokenId);
	selectedTokens.value = newSet;
}

// Token rename
function openRenameDialog(token: Token) {
	tokenToRename.value = token;
	isRenameDialogOpen.value = true;
}

function renameToken(newName: string) {
	if (!tokenToRename.value) return;

	const tokenIndex = tokens.value.findIndex(
		(t) => t.id === tokenToRename.value?.id,
	);
	if (tokenIndex !== -1) {
		tokens.value[tokenIndex].name = newName;
	}

	isRenameDialogOpen.value = false;
	tokenToRename.value = null;
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Create Token Section -->
      <Card class="mb-8 py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Create New Token</CardTitle>
          <CardDescription
            >Generate a new API token for accessing your
            account</CardDescription
          >
        </CardHeader>
        <CardContent>
          <div class="flex gap-4">
            <div class="space-y-2 flex-1">
              <Label for="tokenName">Token Name</Label>
              <Input
                id="tokenName"
                v-model="tokenName"
                placeholder="e.g., Production API"
              />
            </div>

            <div class="space-y-2 flex-1">
              <Label for="tokenExpiration">Expiration</Label>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="w-full justify-between">
                    {{
                      expirations.find((e) => e.value === tokenExpiration)
                        ?.label
                    }}
                    <ChevronDown :size="16" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-full">
                  <DropdownMenuItem
                    v-for="expiration in expirations"
                    :key="expiration.value"
                    @click="tokenExpiration = expiration.value"
                  >
                    {{ expiration.label }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
        <CardFooter
          class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
        >
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Store your token securely. It won't be shown again.
          </p>
          <Button @click="createToken" :disabled="!tokenName.trim()">
            <Key :size="16" class="mr-2" />
            Generate Token
          </Button>
        </CardFooter>
      </Card>

      <!-- Active Tokens -->
      <Card class="overflow-hidden py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Active Tokens</CardTitle>
          <CardDescription>
            {{ tokens.length }}
            {{ tokens.length === 1 ? "token" : "tokens" }} in use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TokensTable
            v-if="tokens.length > 0"
            :tokens="tokens"
            :selected-tokens="selectedTokens"
            :all-selected="allSelected"
            @toggle-select-all="toggleSelectAll"
            @toggle-token="toggleToken"
            @delete-token="openDeleteDialog"
            @delete-selected="openDeleteMultipleDialog"
            @rename-token="openRenameDialog"
          />
          <Empty v-else>
            <EmptyHeader>
              <Key :size="48" class="mx-auto text-neutral-400 mb-4" />
              <EmptyTitle>No tokens found</EmptyTitle>
              <EmptyDescription>
                Create your first API token to get started with programmatic
                access.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
        <CardFooter
          class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
        >
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Tokens provide access to your account. Keep them secure and rotate
            them regularly.
          </p>
        </CardFooter>
      </Card>

      <!-- Token Created Modal -->
      <TokenCreatedModal
        :open="isTokenCreatedModalOpen"
        :token="newTokenGenerated"
        @update:open="closeTokenCreatedModal"
      />

      <!-- Delete Token Modal -->
      <DeleteTokenModal
        :open="isDeleteDialogOpen"
        :token="tokenToDelete"
        @update:open="isDeleteDialogOpen = $event"
        @confirm="deleteToken"
      />

      <!-- Delete Multiple Tokens Modal -->
      <DeleteMultipleTokensModal
        :open="isDeleteMultipleDialogOpen"
        :count="selectedTokens.size"
        @update:open="isDeleteMultipleDialogOpen = $event"
        @confirm="deleteSelectedTokens"
      />

      <!-- Rename Token Modal -->
      <RenameTokenModal
        :open="isRenameDialogOpen"
        :token="tokenToRename"
        @update:open="isRenameDialogOpen = $event"
        @confirm="renameToken"
      />
    </div>
  </div>
</template>
