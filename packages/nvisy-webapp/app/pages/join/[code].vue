<script setup lang="ts">
import { useQuery, useMutation } from "@pinia/colada";
import {
	Users,
	Shield,
	Clock,
	Check,
	XCircle,
	Loader2,
	X,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntityAvatar } from "@/components/common";
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
		const workspaceId = preview.value?.workspaceId;
		if (workspaceId) {
			await refreshWorkspaces();
			selectWorkspace(workspaceId);
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
      <Card
        v-if="isLoading"
        class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardContent class="flex flex-col items-center justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-neutral-400 mb-4" />
          <p class="text-neutral-600 dark:text-neutral-400">
            {{ t("invite.loading") }}
          </p>
        </CardContent>
      </Card>

      <!-- Error State -->
      <Card
        v-else-if="error"
        class="py-0 pt-6 rounded-xl border-red-200 dark:border-red-900"
      >
        <CardContent class="flex flex-col items-center justify-center py-12">
          <XCircle class="h-12 w-12 text-red-500 mb-4" />
          <h2 class="text-xl font-medium text-neutral-900 dark:text-white mb-2">
            {{ t("invite.error.title") }}
          </h2>
          <p
            class="text-neutral-600 dark:text-neutral-400 text-center max-w-sm"
          >
            {{ t("invite.error.description") }}
          </p>
        </CardContent>
      </Card>

      <!-- Expired State -->
      <Card
        v-else-if="isExpired"
        class="py-0 pt-6 rounded-xl border-amber-200 dark:border-amber-900"
      >
        <CardContent class="flex flex-col items-center justify-center py-12">
          <Clock class="h-12 w-12 text-amber-500 mb-4" />
          <h2 class="text-xl font-medium text-neutral-900 dark:text-white mb-2">
            {{ t("invite.expired") }}
          </h2>
          <p
            class="text-neutral-600 dark:text-neutral-400 text-center max-w-sm"
          >
            {{ t("invite.expiredDescription") }}
          </p>
        </CardContent>
      </Card>

      <!-- Preview Card -->
      <Card
        v-else-if="preview"
        class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardHeader class="text-center pb-4">
          <CardTitle class="text-4xl font-normal text-black dark:text-white">
            {{ t("invite.title") }}
          </CardTitle>
          <CardDescription>
            {{ t("invite.subtitle") }}
          </CardDescription>
        </CardHeader>

        <CardContent class="space-y-5">
          <!-- Workspace Info -->
          <div class="flex items-center gap-4">
            <EntityAvatar :name="preview.displayName" size="lg" />
            <div class="flex-1 min-w-0">
              <h3
                class="text-lg font-normal text-neutral-900 dark:text-white truncate"
              >
                {{ preview.displayName }}
              </h3>
              <p
                v-if="preview.description"
                class="text-sm font-normal text-neutral-600 dark:text-neutral-400 mt-0.5 line-clamp-2"
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
              class="text-xs font-normal"
            >
              {{ tag }}
            </Badge>
          </div>

          <!-- Role & Expiry Info -->
          <div
            class="flex items-center justify-between text-sm font-normal text-neutral-600 dark:text-neutral-400"
          >
            <div class="flex items-center gap-2">
              <component
                :is="getRoleIcon(preview.invitedRole)"
                class="h-4 w-4"
              />
              <span
                >{{ t("invite.yourRole") }}:
                <span
                  class="font-normal text-neutral-700 dark:text-neutral-300"
                  >{{ t(`members.roles.${preview.invitedRole}`) }}</span
                ></span
              >
            </div>
            <div class="flex items-center gap-2">
              <Clock class="h-4 w-4" />
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
              class="flex-1 h-10 font-normal"
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
              class="flex-1 h-10 font-normal"
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
          class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
        >
          <p
            class="text-sm font-normal text-neutral-600 dark:text-neutral-400 text-center w-full"
          >
            {{ t("invite.footer") }}
          </p>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
