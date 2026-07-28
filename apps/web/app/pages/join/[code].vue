<script setup lang="ts">
import { useQuery, useMutation } from "@pinia/colada";
import { Users, Shield, Clock, Check, XCircle, Loader2, X } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	CardDescription,
} from "#console/components/ui/card";
import { Badge } from "#console/components/ui/badge";
import { EntityAvatar } from "#console/components/common";
import type { InvitePreview, WorkspaceRole } from "@nvisy/sdk/datatypes";

useHead({ title: "Join Workspace" });

definePageMeta({
	layout: "default",
});

const { t } = useI18n();
const route = useRoute();
const { authToken } = useAuth();
const { $nvisyClient } = useNuxtApp();
const { selectWorkspace, refresh: refreshWorkspaces } = useWorkspaces();

const inviteCode = computed(() => route.params.code as string);

// Fetch invite preview (requires authentication)
const previewQuery = useQuery({
	key: () => ["invite-preview", inviteCode.value],
	query: async (): Promise<InvitePreview> => {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		return await client.invites.previewInvite(inviteCode.value);
	},
	enabled: () => !!inviteCode.value && !!authToken.value?.apiToken,
});

// Accept invite mutation
const acceptMutation = useMutation({
	mutation: async () => {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		return await client.invites.replyToInviteCode(inviteCode.value, {
			acceptInvite: true,
		});
	},
	async onSuccess() {
		// Refresh workspaces list and switch to the new workspace
		const workspaceSlug = preview.value?.workspaceSlug;
		if (workspaceSlug) {
			await refreshWorkspaces();
			selectWorkspace(workspaceSlug);
		}
		navigateTo("/");
	},
});

// Decline invite mutation
const declineMutation = useMutation({
	mutation: async () => {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		return await client.invites.replyToInviteCode(inviteCode.value, {
			acceptInvite: false,
		});
	},
	onSuccess() {
		navigateTo("/");
	},
});

const preview = computed(() => previewQuery.data.value);
const isLoading = computed(() => previewQuery.isLoading.value);
const error = computed(() => previewQuery.error.value);
const isAccepting = computed(() => acceptMutation.isLoading.value);
const isDeclining = computed(() => declineMutation.isLoading.value);
const isProcessing = computed(() => isAccepting.value || isDeclining.value);
const actionError = computed(
	() => acceptMutation.error.value || declineMutation.error.value,
);

const isExpired = computed(() => {
	if (!preview.value?.expiresAt) return false;
	return new Date(preview.value.expiresAt) < new Date();
});

function getRoleIcon(role: WorkspaceRole) {
	switch (role) {
		case "owner":
		case "admin":
			return Shield;
		default:
			return Users;
	}
}

function formatExpiryTime(expiresAt: string): string {
	const expiry = new Date(expiresAt);
	const now = new Date();
	const diffMs = expiry.getTime() - now.getTime();

	if (diffMs <= 0) return t("invite.expired");

	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffHours / 24);

	if (diffDays > 0) {
		return t("invite.expiresInDays", { days: diffDays });
	}
	return t("invite.expiresInHours", { hours: diffHours });
}

function handleAccept() {
	acceptMutation.mutate();
}

function handleDecline() {
	declineMutation.mutate();
}
</script>

<template>
  <div class="flex flex-1 flex-col items-center justify-center p-4 min-h-full">
    <div class="w-full max-w-xl">
      <!-- Loading State -->
      <Card v-if="isLoading" class="py-0 pt-6 rounded-xl border-border/50">
        <CardContent class="flex flex-col items-center justify-center py-12">
          <Loader2 :size="24" class="animate-spin text-muted-foreground mb-4" />
          <p class="text-sm text-muted-foreground">
            {{ t("invite.loading") }}
          </p>
        </CardContent>
      </Card>

      <!-- Error State -->
      <Card
        v-else-if="error"
        class="py-0 pt-6 rounded-xl border-red-200 dark:border-red-900/50"
      >
        <CardContent class="flex flex-col items-center justify-center py-12">
          <XCircle class="size-10 text-red-500 mb-4" />
          <h2 class="text-lg font-medium text-foreground mb-2">
            {{ t("invite.error.title") }}
          </h2>
          <p class="text-sm text-muted-foreground text-center max-w-sm">
            {{ t("invite.error.description") }}
          </p>
        </CardContent>
      </Card>

      <!-- Expired State -->
      <Card
        v-else-if="isExpired"
        class="py-0 pt-6 rounded-xl border-amber-200 dark:border-amber-900/50"
      >
        <CardContent class="flex flex-col items-center justify-center py-12">
          <Clock class="size-10 text-amber-500 mb-4" />
          <h2 class="text-lg font-medium text-foreground mb-2">
            {{ t("invite.expired") }}
          </h2>
          <p class="text-sm text-muted-foreground text-center max-w-sm">
            {{ t("invite.expiredDescription") }}
          </p>
        </CardContent>
      </Card>

      <!-- Preview Card -->
      <Card v-else-if="preview" class="py-0 pt-6 rounded-xl border-border/50">
        <CardHeader class="text-center pb-4">
          <CardTitle class="text-2xl font-medium text-foreground">
            {{ t("invite.title") }}
          </CardTitle>
          <CardDescription class="text-sm text-muted-foreground">
            {{ t("invite.subtitle") }}
          </CardDescription>
        </CardHeader>

        <CardContent class="space-y-5">
          <!-- Workspace Info -->
          <div class="flex items-center gap-4">
            <EntityAvatar :name="preview.displayName" size="lg" />
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-medium text-foreground truncate">
                {{ preview.displayName }}
              </h3>
              <p
                v-if="preview.description"
                class="text-sm text-muted-foreground mt-0.5 line-clamp-2"
              >
                {{ preview.description }}
              </p>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="preview.tags?.length" class="flex flex-wrap gap-1.5">
            <Badge
              v-for="tag in preview.tags"
              :key="tag"
              variant="secondary"
              class="text-xs"
            >
              {{ tag }}
            </Badge>
          </div>

          <!-- Role & Expiry Info -->
          <div
            class="flex items-center justify-between text-sm text-muted-foreground"
          >
            <div class="flex items-center gap-2">
              <component
                :is="getRoleIcon(preview.invitedRole)"
                class="size-4"
              />
              <span
                >{{ t("invite.yourRole") }}:
                <span class="text-foreground">{{
                  t(`members.roles.${preview.invitedRole}`)
                }}</span></span
              >
            </div>
            <div class="flex items-center gap-2">
              <Clock class="size-4" />
              <span>{{ formatExpiryTime(preview.expiresAt) }}</span>
            </div>
          </div>

          <!-- Action Error -->
          <div
            v-if="actionError"
            class="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-md"
          >
            {{ (actionError as any).message || t("invite.joinError") }}
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4">
            <Button
              class="flex-1 h-9"
              :disabled="isProcessing"
              @click="handleAccept"
            >
              <span
                v-if="!isAccepting"
                class="flex items-center justify-center gap-2"
              >
                <Check :size="16" />
                {{ t("invite.accept") }}
              </span>
              <span v-else class="flex items-center justify-center gap-2">
                <Loader2 :size="16" class="animate-spin" />
                {{ t("invite.joining") }}
              </span>
            </Button>
            <Button
              variant="outline"
              class="flex-1 h-9"
              :disabled="isProcessing"
              @click="handleDecline"
            >
              <span
                v-if="!isDeclining"
                class="flex items-center justify-center gap-2"
              >
                <X :size="16" />
                {{ t("invite.decline") }}
              </span>
              <span v-else class="flex items-center justify-center gap-2">
                <Loader2 :size="16" class="animate-spin" />
              </span>
            </Button>
          </div>
        </CardContent>

        <CardFooter
          class="border-t border-border/50 pb-6 bg-muted/30 rounded-b-xl"
        >
          <p class="text-xs text-muted-foreground text-center w-full">
            {{ t("invite.footer") }}
          </p>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
