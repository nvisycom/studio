<script setup lang="ts">
import type {
  Member,
  Invite,
  InviteExpiration,
  WorkspaceRole,
  ListMembersQuery,
  ListInvitesQuery,
  MemberSortField,
  InviteSortField,
  SortOrder,
} from "@nvisy/sdk/datatypes";
import { NvisyApiError } from "@nvisy/sdk";
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
  DeleteMemberModal,
  DeleteMultipleMembersModal,
  CancelInviteModal,
  CancelMultipleInvitesModal,
  InviteMembersCard,
  TeamListCard,
} from "~/components/pages/team";

definePageMeta({
  pageCategory: "Team",
});

const { t } = useI18n();

// Filter & Sort State
const searchQuery = ref("");
const selectedRoleFilter = ref<WorkspaceRole | null>(null);
const selectedSortField = ref<MemberSortField | InviteSortField>("date");
const selectedSortOrder = ref<SortOrder>("desc");

// Build query objects for SDK
const membersQuery = computed<ListMembersQuery>(() => ({
  role: selectedRoleFilter.value,
  sortBy: selectedSortField.value as MemberSortField,
  order: selectedSortOrder.value,
}));

const invitesQuery = computed<ListInvitesQuery>(() => ({
  role: selectedRoleFilter.value,
  sortBy: selectedSortField.value as InviteSortField,
  order: selectedSortOrder.value,
}));

// Use SDK composables with query params
const {
  members,
  isLoading: isLoadingMembers,
  removeMemberAsync,
} = useMembers(membersQuery);

const {
  invites,
  isLoading: isLoadingInvites,
  refresh: refreshInvites,
  sendInviteAsync,
  isSending,
  cancelInviteAsync,
  generateCodeAsync,
  isGenerating,
} = useInvites(invitesQuery);

// UI feedback state
const copiedInviteLink = ref(false);
const inviteSent = ref(false);

// Modal State
const memberToDelete = ref<Member | null>(null);
const isDeleteMemberDialogOpen = ref(false);
const isDeleteMultipleMembersDialogOpen = ref(false);
const inviteToCancel = ref<Invite | null>(null);
const isCancelInviteDialogOpen = ref(false);
const isCancelMultipleInvitesDialogOpen = ref(false);

// Client-side search filter (search isn't supported by SDK)
const filteredMembers = computed(() => {
  if (!members.value) return [];
  if (!searchQuery.value) return members.value;

  const query = searchQuery.value.toLowerCase();
  return members.value.filter(
    (member) =>
      member.displayName.toLowerCase().includes(query) ||
      member.emailAddress.toLowerCase().includes(query),
  );
});

const pendingInvites = computed(() => {
  if (!invites.value) return [];
  return invites.value.filter((invite) => invite.inviteStatus === "pending");
});

const filteredInvites = computed(() => {
  if (!searchQuery.value) return pendingInvites.value;

  const query = searchQuery.value.toLowerCase();
  return pendingInvites.value.filter((invite) =>
    (invite.emailAddress ?? "").toLowerCase().includes(query),
  );
});

// Selection using composable
const membersSelection = useSelection({
  items: filteredMembers,
  getKey: (m) => m.accountId,
  isSelectable: (m) => m.memberRole !== "owner",
});

const invitesSelection = useSelection({
  items: filteredInvites,
  getKey: (i) => i.inviteId,
});

// ===== Invite Functions =====

async function handleSendInvite(
  email: string,
  role: WorkspaceRole,
  expiry: InviteExpiration,
) {
  try {
    await sendInviteAsync({
      inviteeEmail: email,
      invitedRole: role,
      expiresIn: expiry,
    });
    inviteSent.value = true;
    toast.success(t("members.messages.inviteSent"));
    setTimeout(() => {
      inviteSent.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to send invite:", err);
    toast.error(getErrorMessage(err, t("members.errors.inviteFailed")));
  }
}

async function handleCopyLink(role: WorkspaceRole, expiry: InviteExpiration) {
  try {
    const result = await generateCodeAsync({
      invitedRole: role,
      expiresIn: expiry,
    });
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/invite/${result.inviteCode}`;
    await navigator.clipboard.writeText(inviteUrl);
    copiedInviteLink.value = true;
    refreshInvites();
    toast.success(t("members.messages.linkCopied"));
    setTimeout(() => {
      copiedInviteLink.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to generate invite link:", err);
    toast.error(getErrorMessage(err, t("members.errors.linkFailed")));
  }
}

// ===== Member Deletion Functions =====

function openDeleteMemberDialog(memberId: string) {
  const member = members.value?.find((m) => m.accountId === memberId);
  if (member) {
    memberToDelete.value = member;
    isDeleteMemberDialogOpen.value = true;
  }
}

async function deleteMember() {
  if (!memberToDelete.value) return;

  try {
    await removeMemberAsync(memberToDelete.value.accountId);
    isDeleteMemberDialogOpen.value = false;
    memberToDelete.value = null;
    toast.success(t("members.messages.memberRemoved"));
  } catch (err) {
    console.error("Failed to remove member:", err);
    toast.error(getErrorMessage(err, t("members.errors.removeFailed")));
  }
}

async function deleteSelectedMembers() {
  try {
    await Promise.all(
      Array.from(membersSelection.selected.value).map((accountId) =>
        removeMemberAsync(accountId),
      ),
    );
    membersSelection.clear();
    isDeleteMultipleMembersDialogOpen.value = false;
    toast.success(t("members.messages.membersRemoved"));
  } catch (err) {
    console.error("Failed to remove members:", err);
    toast.error(getErrorMessage(err, t("members.errors.removeFailed")));
  }
}

// ===== Invite Cancellation Functions =====

function openCancelInviteDialog(inviteId: string) {
  const invite = invites.value?.find((i) => i.inviteId === inviteId);
  if (invite) {
    inviteToCancel.value = invite;
    isCancelInviteDialogOpen.value = true;
  }
}

async function cancelInvite() {
  if (!inviteToCancel.value) return;

  try {
    await cancelInviteAsync(inviteToCancel.value.inviteId);
    isCancelInviteDialogOpen.value = false;
    inviteToCancel.value = null;
    toast.success(t("members.messages.inviteCanceled"));
  } catch (err) {
    console.error("Failed to cancel invite:", err);
    toast.error(getErrorMessage(err, t("members.errors.cancelFailed")));
  }
}

async function cancelSelectedInvites() {
  try {
    await Promise.all(
      Array.from(invitesSelection.selected.value).map((inviteId) =>
        cancelInviteAsync(inviteId),
      ),
    );
    invitesSelection.clear();
    isCancelMultipleInvitesDialogOpen.value = false;
    toast.success(t("members.messages.invitesCanceled"));
  } catch (err) {
    console.error("Failed to cancel invites:", err);
    toast.error(getErrorMessage(err, t("members.errors.cancelFailed")));
  }
}

function handleSortingChange(
  sortBy: MemberSortField | InviteSortField,
  order: SortOrder,
) {
  selectedSortField.value = sortBy;
  selectedSortOrder.value = order;
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <InviteMembersCard
        :is-sending="isSending"
        :is-generating="isGenerating"
        :copied-invite-link="copiedInviteLink"
        :invite-sent="inviteSent"
        @send-invite="handleSendInvite"
        @copy-link="handleCopyLink"
      />

      <TeamListCard
        :members="filteredMembers"
        :invites="filteredInvites"
        :is-loading-members="isLoadingMembers"
        :is-loading-invites="isLoadingInvites"
        :selected-members="membersSelection.selected.value"
        :selected-invites="invitesSelection.selected.value"
        :all-members-selected="membersSelection.allSelected.value"
        :all-invites-selected="invitesSelection.allSelected.value"
        @update:search-query="searchQuery = $event"
        @update:role-filter="selectedRoleFilter = $event"
        @update:sorting="handleSortingChange"
        @remove-member="openDeleteMemberDialog"
        @cancel-invite="openCancelInviteDialog"
        @toggle-select-all-members="membersSelection.toggleAll"
        @toggle-member="membersSelection.toggle"
        @delete-selected-members="isDeleteMultipleMembersDialogOpen = true"
        @toggle-select-all-invites="invitesSelection.toggleAll"
        @toggle-invite="invitesSelection.toggle"
        @cancel-selected-invites="isCancelMultipleInvitesDialogOpen = true"
      />

      <!-- Modals -->
      <DeleteMemberModal
        :open="isDeleteMemberDialogOpen"
        :member="memberToDelete"
        @update:open="isDeleteMemberDialogOpen = $event"
        @confirm="deleteMember"
      />

      <DeleteMultipleMembersModal
        :open="isDeleteMultipleMembersDialogOpen"
        :count="membersSelection.selected.value.size"
        @update:open="isDeleteMultipleMembersDialogOpen = $event"
        @confirm="deleteSelectedMembers"
      />

      <CancelInviteModal
        :open="isCancelInviteDialogOpen"
        :invite="inviteToCancel"
        @update:open="isCancelInviteDialogOpen = $event"
        @confirm="cancelInvite"
      />

      <CancelMultipleInvitesModal
        :open="isCancelMultipleInvitesDialogOpen"
        :count="invitesSelection.selected.value.size"
        @update:open="isCancelMultipleInvitesDialogOpen = $event"
        @confirm="cancelSelectedInvites"
      />
    </div>
  </div>
</template>
