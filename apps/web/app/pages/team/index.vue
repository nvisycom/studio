<script setup lang="ts">
import type {
	Member,
	Invite,
	InviteExpiration,
	WorkspaceRole,
	ListMembers,
	ListInvites,
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
	EditMemberModal,
	CancelInviteModal,
	CancelMultipleInvitesModal,
	InviteMembersCard,
	TeamListCard,
} from "#console/components/pages/team";

useHead({ title: "Team" });

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
const membersQuery = computed<ListMembers>(() => ({
	...(selectedRoleFilter.value && { role: selectedRoleFilter.value }),
	sortBy: selectedSortField.value as MemberSortField,
	order: selectedSortOrder.value,
}));

const invitesQuery = computed<ListInvites>(() => ({
	...(selectedRoleFilter.value && { role: selectedRoleFilter.value }),
	// Map "name" to "email" for invites (members use "name", invites use "email")
	sortBy: (selectedSortField.value === "name"
		? "email"
		: selectedSortField.value) as InviteSortField,
	order: selectedSortOrder.value,
}));

// Use SDK composables with query params
const {
	members,
	isLoading: isLoadingMembers,
	removeMemberAsync,
	updateMemberAsync,
	isUpdatingMember,
	refresh: refreshMembers,
} = useMembers(membersQuery);

const {
	invites,
	isLoading: isLoadingInvites,
	sendInviteAsync,
	isSending,
	cancelInviteAsync,
	generateCodeAsync,
	isGenerating,
	refresh: refreshInvites,
} = useInvites(invitesQuery);

// UI feedback state
const copiedInviteLink = ref(false);
const inviteSent = ref(false);

// Modal State
const memberToDelete = ref<Member | null>(null);
const isDeleteMemberDialogOpen = ref(false);
const isDeleteMultipleMembersDialogOpen = ref(false);
const memberToEdit = ref<Member | null>(null);
const isEditMemberDialogOpen = ref(false);
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
			member.displayName?.toLowerCase().includes(query) ||
			member.emailAddress.toLowerCase().includes(query),
	);
});

const pendingInvites = computed(() => {
	if (!invites.value) return [];
	console.log(invites.value);
	return invites.value.filter((invite) => invite.inviteStatus === "pending");
});

const filteredInvites = computed(() => {
	if (!searchQuery.value) return pendingInvites.value;

	const query = searchQuery.value.toLowerCase();
	return pendingInvites.value.filter((invite) =>
		(invite.inviteeEmail ?? "").toLowerCase().includes(query),
	);
});

// Selection using composable
const membersSelection = useSelection({
	items: filteredMembers,
	getKey: (m) => m.username,
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
		const errorMessage = getErrorMessage(err, t("members.errors.inviteFailed"));
		toast.error(t("members.errors.inviteFailed"), {
			description: errorMessage,
		});
	}
}

async function handleCopyLink(role: WorkspaceRole, expiry: InviteExpiration) {
	try {
		const result = await generateCodeAsync({
			invitedRole: role,
			expiresIn: expiry,
		});
		const baseUrl = window.location.origin;
		const inviteUrl = `${baseUrl}/join/${result.inviteCode}`;
		await navigator.clipboard.writeText(inviteUrl);
		copiedInviteLink.value = true;
		toast.success(t("members.messages.linkCopied"));
		setTimeout(() => {
			copiedInviteLink.value = false;
		}, 2000);
		await refreshInvites();
	} catch (err) {
		toast.error(getErrorMessage(err, t("members.errors.linkFailed")));
	}
}

// ===== Member Deletion Functions =====

function openDeleteMemberDialog(memberId: string) {
	const member = members.value?.find((m) => m.username === memberId);
	if (member) {
		memberToDelete.value = member;
		isDeleteMemberDialogOpen.value = true;
	}
}

async function deleteMember() {
	if (!memberToDelete.value) return;

	try {
		await removeMemberAsync(memberToDelete.value.username);
		isDeleteMemberDialogOpen.value = false;
		memberToDelete.value = null;
		toast.success(t("members.messages.memberRemoved"));
	} catch (err) {
		toast.error(getErrorMessage(err, t("members.errors.removeFailed")));
	}
}

// ===== Member Edit Functions =====

function openEditMemberDialog(memberId: string) {
	const member = members.value?.find((m) => m.username === memberId);
	if (member) {
		memberToEdit.value = member;
		isEditMemberDialogOpen.value = true;
	}
}

async function editMember(role: WorkspaceRole) {
	if (!memberToEdit.value) return;

	try {
		await updateMemberAsync({
			username: memberToEdit.value.username,
			updates: { role },
		});
		isEditMemberDialogOpen.value = false;
		memberToEdit.value = null;
		toast.success(t("members.messages.memberUpdated"));
	} catch (err) {
		toast.error(getErrorMessage(err, t("members.errors.updateFailed")));
	}
}

async function deleteSelectedMembers() {
	const usernames = Array.from(membersSelection.selected.value);
	const results = await Promise.allSettled(
		usernames.map((username) => removeMemberAsync(username)),
	);

	const failed = results.filter((r) => r.status === "rejected");
	const succeeded = results.filter((r) => r.status === "fulfilled");

	// Refresh once after all operations complete to avoid race conditions
	if (succeeded.length > 0) {
		await refreshMembers();
	}

	membersSelection.clear();
	isDeleteMultipleMembersDialogOpen.value = false;

	if (failed.length === 0) {
		toast.success(t("members.messages.membersRemoved"));
	} else if (succeeded.length > 0) {
		toast.warning(t("members.messages.membersPartiallyRemoved"), {
			description: t("members.errors.someRemoveFailed", {
				count: failed.length,
			}),
		});
	} else {
		toast.error(t("members.errors.removeFailed"));
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
		toast.error(getErrorMessage(err, t("members.errors.cancelFailed")));
	}
}

async function cancelSelectedInvites() {
	const inviteIds = Array.from(invitesSelection.selected.value);
	const results = await Promise.allSettled(
		inviteIds.map((inviteId) => cancelInviteAsync(inviteId)),
	);

	const failed = results.filter((r) => r.status === "rejected");
	const succeeded = results.filter((r) => r.status === "fulfilled");

	// Refresh once after all operations complete to avoid race conditions
	if (succeeded.length > 0) {
		await refreshInvites();
	}

	invitesSelection.clear();
	isCancelMultipleInvitesDialogOpen.value = false;

	if (failed.length === 0) {
		toast.success(t("members.messages.invitesCanceled"));
	} else if (succeeded.length > 0) {
		toast.warning(t("members.messages.invitesPartiallyCanceled"), {
			description: t("members.errors.someCancelFailed", {
				count: failed.length,
			}),
		});
	} else {
		toast.error(t("members.errors.cancelFailed"));
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
    <div class="max-w-3xl mx-auto w-full">
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
        @edit-member="openEditMemberDialog"
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

      <EditMemberModal
        :open="isEditMemberDialogOpen"
        :member="memberToEdit"
        :is-loading="isUpdatingMember"
        @update:open="isEditMemberDialogOpen = $event"
        @confirm="editMember"
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
