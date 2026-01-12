<script setup lang="ts">
import { NvisyApiError } from "@nvisy/sdk";
import type {
	ApiToken,
	ApiTokenWithJWT,
	TokenExpiration,
} from "@nvisy/sdk/datatypes";
import { ChevronDown, Key, Loader2 } from "lucide-vue-next";
import { toast } from "vue-sonner";

function getErrorMessage(err: unknown, fallback: string): string {
	if (err instanceof NvisyApiError) {
		return err.message;
	}
	if (err instanceof Error) {
		return err.message;
	}
	return fallback;
}

import {
	DeleteMultipleTokensModal,
	DeleteTokenModal,
	RenameTokenModal,
	TokenCreatedModal,
	TokensTable,
} from "@/components/pages/tokens";
import { Button } from "@/components/ui/button";
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
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

useHead({ title: "API Tokens" });

definePageMeta({
	pageCategory: "Settings",
});

const { t } = useI18n();

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

// Get current auth token to identify active session
const { authToken } = useAuth();

// Get the current session's token ID
const currentTokenId = computed(() => authToken.value?.tokenId ?? null);

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
const expirations = computed(() => [
	{ label: t("tokens.expiration.7days"), value: "in7Days" as TokenExpiration },
	{
		label: t("tokens.expiration.30days"),
		value: "in30Days" as TokenExpiration,
	},
	{
		label: t("tokens.expiration.90days"),
		value: "in90Days" as TokenExpiration,
	},
	{ label: t("tokens.expiration.1year"), value: "in1Year" as TokenExpiration },
	{ label: t("tokens.expiration.never"), value: "never" as TokenExpiration },
]);

// Token creation
async function createToken() {
	if (!tokenName.value.trim()) return;

	try {
		const result = await createTokenAsync({
			name: tokenName.value,
			expiresIn: tokenExpiration.value,
		});

		// The result contains the JWT token (only shown once)
		newTokenGenerated.value = (result as ApiTokenWithJWT).token || null;
		isTokenCreatedModalOpen.value = true;
		toast.success(t("tokens.messages.tokenCreated"));

		// Reset form
		tokenName.value = "";
		tokenExpiration.value = "in90Days";
	} catch (err) {
		toast.error(t("tokens.errors.createFailed"), {
			description: getErrorMessage(err, t("tokens.errors.createFailed")),
		});
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
		toast.success(t("tokens.messages.tokenRevoked"));
	} catch (err) {
		toast.error(t("tokens.errors.revokeFailed"), {
			description: getErrorMessage(err, t("tokens.errors.revokeFailed")),
		});
	}
}

function openDeleteMultipleDialog() {
	isDeleteMultipleDialogOpen.value = true;
}

async function deleteSelectedTokens() {
	const tokenIds = Array.from(selectedTokens.value);
	const results = await Promise.allSettled(
		tokenIds.map((tokenId) => revokeTokenAsync(tokenId)),
	);

	const failed = results.filter((r) => r.status === "rejected");
	const succeeded = results.filter((r) => r.status === "fulfilled");

	selectedTokens.value = new Set();
	isDeleteMultipleDialogOpen.value = false;

	if (failed.length === 0) {
		toast.success(t("tokens.messages.tokensRevoked"));
	} else if (succeeded.length > 0) {
		toast.warning(t("tokens.messages.tokensPartiallyRevoked"), {
			description: t("tokens.errors.someRevokeFailed", {
				count: failed.length,
			}),
		});
	} else {
		toast.error(t("tokens.errors.revokeFailed"));
	}
}

// Computed
const selectableTokens = computed(
	() => tokens.value?.filter((t) => t.id !== currentTokenId.value) ?? [],
);

const allSelected = computed(
	() =>
		selectableTokens.value.length > 0 &&
		selectedTokens.value.size === selectableTokens.value.length,
);

function toggleSelectAll() {
	selectedTokens.value = allSelected.value
		? new Set()
		: new Set(selectableTokens.value.map((t) => t.id));
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
		toast.success(t("tokens.messages.tokenRenamed"));
	} catch (err) {
		toast.error(t("tokens.errors.renameFailed"), {
			description: getErrorMessage(err, t("tokens.errors.renameFailed")),
		});
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Create Token Section -->
      <Card class="mb-8 py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle
            class="text-sm font-light tracking-wider uppercase text-neutral-600 dark:text-neutral-400"
            >{{ t("tokens.create.title") }}</CardTitle
          >
          <CardDescription>{{
            t("tokens.create.description")
          }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex gap-4">
            <div class="space-y-2 flex-1">
              <Label for="tokenName" class="font-light">{{
                t("tokens.create.nameLabel")
              }}</Label>
              <Input
                id="tokenName"
                v-model="tokenName"
                :placeholder="t('tokens.create.namePlaceholder')"
              />
            </div>

            <div class="space-y-2 flex-1">
              <Label for="tokenExpiration" class="font-light">{{
                t("tokens.create.expirationLabel")
              }}</Label>
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
          <p class="text-sm font-light text-neutral-600 dark:text-neutral-400">
            {{ t("tokens.create.footer") }}
          </p>
          <Button
            type="button"
            @click="createToken"
            :disabled="!tokenName.trim() || isCreating"
          >
            <Loader2 v-if="isCreating" :size="16" class="mr-2 animate-spin" />
            <Key v-else :size="16" class="mr-2" />
            {{ t("tokens.create.button") }}
          </Button>
        </CardFooter>
      </Card>

      <!-- Active Tokens -->
      <Card class="overflow-hidden py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle
            class="text-sm font-light tracking-wider uppercase text-neutral-600 dark:text-neutral-400"
            >{{ t("tokens.list.title") }}</CardTitle
          >
          <CardDescription>
            {{
              t(
                "tokens.list.description",
                { count: tokens?.length ?? 0 },
                tokens?.length ?? 0,
              )
            }}
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
            :current-token-id="currentTokenId"
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
              <EmptyTitle>{{ t("tokens.empty.title") }}</EmptyTitle>
              <EmptyDescription>
                {{ t("tokens.empty.description") }}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
        <CardFooter
          class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
        >
          <p class="text-sm font-light text-neutral-600 dark:text-neutral-400">
            {{ t("tokens.list.footer") }}
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
