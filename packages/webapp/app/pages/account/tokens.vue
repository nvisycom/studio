<script setup lang="ts">
import type { ApiToken, ApiTokenWithJWT, TokenExpiration } from "@nvisy/sdk";
import { Key, ChevronDown, Loader2 } from "lucide-vue-next";
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
  pageCategory: "Settings",
});

// Use the API tokens composable
const {
  tokens,
  isLoading,
  error,
  createTokenAsync,
  isCreating,
  updateTokenAsync,
  revokeTokenAsync,
  isRevoking,
} = useApiTokens();

// Form state
const tokenName = ref("");
const tokenExpiration = ref<TokenExpiration>("in90Days");

// Modal state
const newTokenGenerated = ref<string | null>(null);
const isTokenCreatedModalOpen = ref(false);
const tokenToDelete = ref<ApiToken | null>(null);
const isDeleteDialogOpen = ref(false);
const isDeleteMultipleDialogOpen = ref(false);
const tokenToRename = ref<ApiToken | null>(null);
const isRenameDialogOpen = ref(false);

// Selection state
const selectedTokens = ref<Set<string>>(new Set());

// Constants
const expirations = [
  { label: "7 days", value: "in7Days" as TokenExpiration },
  { label: "30 days", value: "in30Days" as TokenExpiration },
  { label: "90 days", value: "in90Days" as TokenExpiration },
  { label: "1 year", value: "in1Year" as TokenExpiration },
  { label: "Never", value: "never" as TokenExpiration },
] as const;

// Token creation
async function createToken() {
  if (!tokenName.value.trim()) return;

  try {
    const result = await createTokenAsync({
      name: tokenName.value,
      expires: tokenExpiration.value,
    });

    // The result contains the JWT token (only shown once)
    newTokenGenerated.value = (result as ApiTokenWithJWT).token || null;
    isTokenCreatedModalOpen.value = true;

    // Reset form
    tokenName.value = "";
    tokenExpiration.value = "in90Days";
  } catch (err) {
    console.error("Failed to create token:", err);
  }
}

function closeTokenCreatedModal() {
  isTokenCreatedModalOpen.value = false;
  newTokenGenerated.value = null;
}

// Token deletion (revocation)
function openDeleteDialog(token: ApiToken) {
  tokenToDelete.value = token;
  isDeleteDialogOpen.value = true;
}

async function deleteToken() {
  if (!tokenToDelete.value) return;

  try {
    await revokeTokenAsync(tokenToDelete.value.id);
    isDeleteDialogOpen.value = false;
    tokenToDelete.value = null;
  } catch (err) {
    console.error("Failed to revoke token:", err);
  }
}

function openDeleteMultipleDialog() {
  isDeleteMultipleDialogOpen.value = true;
}

async function deleteSelectedTokens() {
  try {
    // Revoke all selected tokens by their IDs
    await Promise.all(
      Array.from(selectedTokens.value).map((tokenId) =>
        revokeTokenAsync(tokenId),
      ),
    );
    selectedTokens.value = new Set();
    isDeleteMultipleDialogOpen.value = false;
  } catch (err) {
    console.error("Failed to revoke tokens:", err);
  }
}

// Computed
const allSelected = computed(
  () =>
    (tokens.value?.length ?? 0) > 0 &&
    selectedTokens.value.size === (tokens.value?.length ?? 0),
);

function toggleSelectAll() {
  selectedTokens.value = allSelected.value
    ? new Set()
    : new Set(tokens.value?.map((t) => t.id) ?? []);
}

function toggleToken(tokenId: string) {
  const newSet = new Set(selectedTokens.value);
  newSet.has(tokenId) ? newSet.delete(tokenId) : newSet.add(tokenId);
  selectedTokens.value = newSet;
}

// Token rename
function openRenameDialog(token: ApiToken) {
  tokenToRename.value = token;
  isRenameDialogOpen.value = true;
}

async function renameToken(newName: string) {
  if (!tokenToRename.value) return;

  try {
    await updateTokenAsync({
      tokenId: tokenToRename.value.id,
      updates: { name: newName },
    });
    isRenameDialogOpen.value = false;
    tokenToRename.value = null;
  } catch (err) {
    console.error("Failed to rename token:", err);
  }
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
          <Button
            @click="createToken"
            :disabled="!tokenName.trim() || isCreating"
          >
            <Loader2 v-if="isCreating" :size="16" class="mr-2 animate-spin" />
            <Key v-else :size="16" class="mr-2" />
            Generate Token
          </Button>
        </CardFooter>
      </Card>

      <!-- Active Tokens -->
      <Card class="overflow-hidden py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Active Tokens</CardTitle>
          <CardDescription>
            {{ tokens?.length ?? 0 }}
            {{ (tokens?.length ?? 0) === 1 ? "token" : "tokens" }} in use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <!-- Loading State -->
          <div v-if="isLoading" class="flex items-center justify-center py-12">
            <Loader2 :size="32" class="animate-spin text-neutral-400" />
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-12 text-red-500">
            <p>Failed to load tokens: {{ error.message }}</p>
          </div>

          <!-- Tokens Table -->
          <TokensTable
            v-else-if="tokens && tokens.length > 0"
            :tokens="tokens"
            :selected-tokens="selectedTokens"
            :all-selected="allSelected"
            @toggle-select-all="toggleSelectAll"
            @toggle-token="toggleToken"
            @delete-token="openDeleteDialog"
            @delete-selected="openDeleteMultipleDialog"
            @rename-token="openRenameDialog"
          />

          <!-- Empty State -->
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
