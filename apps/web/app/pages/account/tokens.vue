<script setup lang="ts">
import type {
	ApiToken,
	ApiTokenWithJWT,
	TokenExpiration,
} from "@nvisy/sdk/datatypes";
import { ChevronDown, Key, Loader2 } from "@lucide/vue";
import { toast } from "vue-sonner";

import {
	RenameTokenModal,
	TokenCreatedModal,
	TokensTable,
} from "#console/components/pages/tokens";
import { ConfirmDialog } from "#console/components/common";
import { Button } from "#console/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#console/components/ui/empty";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";

useHead({ title: "API Tokens" });

definePageMeta({
	pageCategory: "header.category.settings",
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

// The token listing flags which token authenticated the current request,
// so the active session can be marked and protected from bulk revoke.
const currentTokenId = computed<string | null>(
	() => tokens.value?.find((t) => t.current)?.id ?? null,
);

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

// Selection state — the current session's own token can't be bulk-revoked.
const tokensSelection = useSelection({
	items: computed(() => tokens.value ?? []),
	getKey: (token) => token.id,
	isSelectable: (token) => token.id !== currentTokenId.value,
});
const selectedTokens = tokensSelection.selected;

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
			displayName: tokenName.value,
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

	tokensSelection.clear();
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
			updates: { displayName: newName },
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
    <div class="max-w-3xl mx-auto w-full">
      <!-- Create Token Section -->
      <Card class="mb-6 py-0 pt-6 border-border/50">
        <CardHeader class="pb-4">
          <CardTitle
            class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
          >
            {{ t("tokens.create.title") }}
          </CardTitle>
          <CardDescription class="text-sm">
            {{ t("tokens.create.description") }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex gap-4">
            <div class="space-y-2 flex-1">
              <Label for="tokenName" class="text-sm font-medium" required>
                {{ t("tokens.create.nameLabel") }}
              </Label>
              <Input
                id="tokenName"
                v-model="tokenName"
                :placeholder="t('tokens.create.namePlaceholder')"
                class="h-9"
              />
            </div>

            <div class="space-y-2 flex-1">
              <Label for="tokenExpiration" class="text-sm font-medium">
                {{ t("tokens.create.expirationLabel") }}
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="outline"
                    size="sm"
                    class="w-full justify-between h-9"
                  >
                    <span class="text-sm">
                      {{
                        expirations.find((e) => e.value === tokenExpiration)
                          ?.label
                      }}
                    </span>
                    <ChevronDown :size="14" class="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-full">
                  <DropdownMenuItem
                    v-for="expiration in expirations"
                    :key="expiration.value"
                    @click="tokenExpiration = expiration.value"
                    class="text-sm"
                  >
                    {{ expiration.label }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
        <CardFooter
          class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl flex items-center justify-between"
        >
          <p class="text-xs text-muted-foreground">
            {{ t("tokens.create.footer") }}
          </p>
          <Button
            type="button"
            size="sm"
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
      <Card class="overflow-hidden py-0 pt-6 border-border/50">
        <CardHeader class="pb-4">
          <CardTitle
            class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
          >
            {{ t("tokens.list.title") }}
          </CardTitle>
          <CardDescription class="text-sm">
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
            <Loader2 :size="24" class="animate-spin text-muted-foreground" />
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-12">
            <p class="text-sm text-destructive">
              Failed to load tokens: {{ error.message }}
            </p>
          </div>

          <!-- Tokens Table -->
          <TokensTable
            v-else-if="tokens && tokens.length > 0"
            :tokens="tokens"
            :selection="tokensSelection"
            :current-token-id="currentTokenId"
            @delete-token="openDeleteDialog"
            @delete-selected="openDeleteMultipleDialog"
            @rename-token="openRenameDialog"
          />

          <!-- Empty State -->
          <Empty v-else>
            <EmptyHeader>
              <Key :size="32" class="mx-auto text-muted-foreground mb-3" />
              <EmptyTitle>{{ t("tokens.empty.title") }}</EmptyTitle>
              <EmptyDescription>
                {{ t("tokens.empty.description") }}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
        <CardFooter
          class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl"
        >
          <p class="text-xs text-muted-foreground">
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
      <ConfirmDialog
        :open="isDeleteDialogOpen"
        :title="t('tokens.modals.delete.title')"
        :description="
          t('tokens.modals.delete.description', {
            name: tokenToDelete?.displayName,
          })
        "
        :confirm-label="t('tokens.modals.delete.confirmButton')"
        :cancel-label="t('tokens.modals.delete.cancelButton')"
        @update:open="isDeleteDialogOpen = $event"
        @confirm="deleteToken"
      >
        <template v-if="tokenToDelete" #details>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-foreground">
              {{ tokenToDelete.displayName }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ t("tokens.modals.delete.lastUsed") }}:
              {{ tokenToDelete.lastUsedAt ?? t("tokens.modals.delete.never") }}
            </p>
          </div>
        </template>
      </ConfirmDialog>

      <!-- Delete Multiple Tokens Modal -->
      <ConfirmDialog
        :open="isDeleteMultipleDialogOpen"
        :title="t('tokens.modals.deleteMultiple.title')"
        :description="
          t('tokens.modals.deleteMultiple.description', selectedTokens.size)
        "
        :confirm-label="`${t('tokens.modals.deleteMultiple.confirmButton')} (${selectedTokens.size})`"
        :cancel-label="t('tokens.modals.deleteMultiple.cancelButton')"
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
