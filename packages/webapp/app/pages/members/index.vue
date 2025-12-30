<script setup lang="ts">
import { ref, computed } from "vue";
import { Search, Copy, Check, ChevronDown } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MembersTable,
  InvitesTable,
  DeleteMemberModal,
  DeleteMultipleMembersModal,
  CancelInviteModal,
  CancelMultipleInvitesModal,
} from "~/components/pages/members";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

definePageMeta({
  pageCategory: "Members",
});

const { t } = useI18n();

/**
 * Team member data structure
 */
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedDate: Date;
  twoFAEnabled: boolean;
}

/**
 * Pending invitation data structure
 */
interface PendingInvite {
  id: string;
  name: string;
  email: string;
  role: string;
  invitedDate: Date;
}

// Form State
const inviteEmail = ref<string>("");
const selectedRole = ref<string>("member");
const selectedExpiry = ref<string>("never");
const activeTab = ref<string>("members");
const searchQuery = ref<string>("");
const selectedRoleFilter = ref<string>("anyRole");
const selected2FAFilter = ref<string>("any2FA");
const selectedSorting = ref<string>("date-desc");
const copiedInviteLink = ref<boolean>(false);

// Selection State
const selectedMembers = ref<Set<string>>(new Set());
const selectedInvites = ref<Set<string>>(new Set());

// Modal State
const memberToDelete = ref<TeamMember | null>(null);
const isDeleteMemberDialogOpen = ref<boolean>(false);
const isDeleteMultipleMembersDialogOpen = ref<boolean>(false);
const inviteToCancel = ref<PendingInvite | null>(null);
const isCancelInviteDialogOpen = ref<boolean>(false);
const isCancelMultipleInvitesDialogOpen = ref<boolean>(false);

const roles = computed(() => [
  { value: "member", label: t("members.roles.member") },
  { value: "editor", label: t("members.roles.editor") },
  { value: "owner", label: t("members.roles.owner") },
]);

const roleFilters = computed(() => [
  { value: "anyRole", label: t("members.filters.anyRole") },
  { value: "owner", label: t("members.roles.owner") },
  { value: "editor", label: t("members.roles.editor") },
  { value: "member", label: t("members.roles.member") },
]);

const twoFAFilters = computed(() => [
  { value: "any2FA", label: t("members.filters.any2FA") },
  { value: "disabled", label: t("members.filters.disabled2FA") },
  { value: "enabled", label: t("members.filters.enabled2FA") },
]);

const sortingOptions = computed(() => [
  { label: t("members.filters.sorting.nameAsc"), value: "name-asc" },
  { label: t("members.filters.sorting.nameDesc"), value: "name-desc" },
  { label: t("members.filters.sorting.dateNewest"), value: "date-desc" },
  { label: t("members.filters.sorting.dateOldest"), value: "date-asc" },
]);

const inviteExpiryOptions = computed(() => [
  { label: t("members.forms.invite.expiry.never"), value: "never" },
  { label: t("members.forms.invite.expiry.24hours"), value: "24h" },
  { label: t("members.forms.invite.expiry.7days"), value: "7d" },
  { label: t("members.forms.invite.expiry.30days"), value: "30d" },
]);

// Mock data
const teamMembers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "owner",
    joinedDate: new Date("2023-01-15"),
    twoFAEnabled: true,
  },
  {
    id: "2",
    name: "Alice Smith",
    email: "alice@example.com",
    role: "editor",
    joinedDate: new Date("2023-03-22"),
    twoFAEnabled: false,
  },
  {
    id: "3",
    name: "Bob Wilson",
    email: "bob@example.com",
    role: "member",
    joinedDate: new Date("2023-05-10"),
    twoFAEnabled: true,
  },
];

const pendingInvites = [
  {
    id: "1",
    name: "Charlie Brown",
    email: "charlie@example.com",
    role: "member",
    invitedDate: new Date("2023-12-01"),
  },
  {
    id: "2",
    name: "Diana Prince",
    email: "diana@example.com",
    role: "editor",
    invitedDate: new Date("2023-12-03"),
  },
];

// Computed filtered data
const filteredMembers = computed(() => {
  let filtered = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesRole =
      selectedRoleFilter.value === "anyRole" ||
      member.role.toLowerCase() === selectedRoleFilter.value;
    const matches2FA =
      selected2FAFilter.value === "any2FA" ||
      (selected2FAFilter.value === "enabled" && member.twoFAEnabled) ||
      (selected2FAFilter.value === "disabled" && !member.twoFAEnabled);

    return matchesSearch && matchesRole && matches2FA;
  });

  // Sort the results
  if (selectedSorting.value === "name-asc") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (selectedSorting.value === "name-desc") {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  } else if (selectedSorting.value === "date-asc") {
    filtered.sort((a, b) => a.joinedDate.getTime() - b.joinedDate.getTime());
  } else if (selectedSorting.value === "date-desc") {
    filtered.sort((a, b) => b.joinedDate.getTime() - a.joinedDate.getTime());
  }

  return filtered;
});

const filteredInvites = computed(() => {
  let filtered = pendingInvites.filter((invite) => {
    const matchesSearch =
      invite.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      invite.email.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesRole =
      selectedRoleFilter.value === "anyRole" ||
      invite.role.toLowerCase() === selectedRoleFilter.value;

    return matchesSearch && matchesRole;
  });

  // Sort the results
  if (selectedSorting.value === "name-asc") {
    filtered.sort((a, b) => a.email.localeCompare(b.email));
  } else if (selectedSorting.value === "name-desc") {
    filtered.sort((a, b) => b.email.localeCompare(a.email));
  } else if (selectedSorting.value === "date-asc") {
    filtered.sort((a, b) => a.invitedDate.getTime() - b.invitedDate.getTime());
  } else {
    filtered.sort((a, b) => b.invitedDate.getTime() - a.invitedDate.getTime());
  }

  return filtered;
});

// Computed for selection
const allMembersSelected = computed(
  () =>
    filteredMembers.value.length > 0 &&
    filteredMembers.value.filter((m) => m.role !== "Owner").length > 0 &&
    filteredMembers.value
      .filter((m) => m.role !== "Owner")
      .every((m) => selectedMembers.value.has(m.id)),
);

const allInvitesSelected = computed(
  () =>
    filteredInvites.value.length > 0 &&
    filteredInvites.value.every((i) => selectedInvites.value.has(i.id)),
);

// ===== Invite Functions =====

/**
 * Send an invitation email to a new team member
 */
function sendInvite(): void {
  if (!inviteEmail.value.trim()) return;

  console.log(
    "Sending invite to:",
    inviteEmail.value,
    "with role:",
    selectedRole.value,
  );
  inviteEmail.value = "";
  selectedRole.value = "Member";
}

/**
 * Copy the invitation link to clipboard with selected expiry
 */
function copyInviteLink(): void {
  // In a real implementation, this would generate a link with the appropriate expiry
  const inviteLink = `https://app.nvisy.com/invite/abc123def456?expires=${selectedExpiry.value}`;
  navigator.clipboard.writeText(inviteLink);
  copiedInviteLink.value = true;
  setTimeout(() => {
    copiedInviteLink.value = false;
  }, 2000);
}

// ===== Member Deletion Functions =====

/**
 * Open the delete dialog for a specific member
 * @param memberId - ID of the member to delete
 */
function openDeleteMemberDialog(memberId: string): void {
  const member = teamMembers.find((m) => m.id === memberId);
  if (member) {
    memberToDelete.value = member;
    isDeleteMemberDialogOpen.value = true;
  }
}

/**
 * Confirm and execute member deletion
 */
function deleteMember(): void {
  if (!memberToDelete.value) return;
  console.log("Deleting member:", memberToDelete.value.id);
  isDeleteMemberDialogOpen.value = false;
  memberToDelete.value = null;
}

/**
 * Open the dialog for deleting multiple members
 */
function openDeleteMultipleMembersDialog(): void {
  isDeleteMultipleMembersDialogOpen.value = true;
}

/**
 * Confirm and execute bulk member deletion
 */
function deleteSelectedMembers(): void {
  console.log("Deleting members:", Array.from(selectedMembers.value));
  selectedMembers.value = new Set();
  isDeleteMultipleMembersDialogOpen.value = false;
}

// ===== Invite Cancellation Functions =====

/**
 * Open the cancel dialog for a specific invitation
 * @param inviteId - ID of the invitation to cancel
 */
function openCancelInviteDialog(inviteId: string): void {
  const invite = pendingInvites.find((i) => i.id === inviteId);
  if (invite) {
    inviteToCancel.value = invite;
    isCancelInviteDialogOpen.value = true;
  }
}

/**
 * Confirm and execute invitation cancellation
 */
function cancelInvite(): void {
  if (!inviteToCancel.value) return;
  console.log("Canceling invite:", inviteToCancel.value.id);
  isCancelInviteDialogOpen.value = false;
  inviteToCancel.value = null;
}

/**
 * Open the dialog for canceling multiple invitations
 */
function openCancelMultipleInvitesDialog(): void {
  isCancelMultipleInvitesDialogOpen.value = true;
}

/**
 * Confirm and execute bulk invitation cancellation
 */
function cancelSelectedInvites(): void {
  console.log("Canceling invites:", Array.from(selectedInvites.value));
  selectedInvites.value = new Set();
  isCancelMultipleInvitesDialogOpen.value = false;
}

// ===== Selection Functions =====

/**
 * Toggle selection for all non-owner members
 */
function toggleSelectAllMembers(): void {
  if (allMembersSelected.value) {
    selectedMembers.value = new Set();
  } else {
    selectedMembers.value = new Set(
      filteredMembers.value.filter((m) => m.role !== "Owner").map((m) => m.id),
    );
  }
}

/**
 * Toggle selection for a specific member
 * @param memberId - ID of the member to toggle
 */
function toggleMember(memberId: string): void {
  const newSet = new Set(selectedMembers.value);
  newSet.has(memberId) ? newSet.delete(memberId) : newSet.add(memberId);
  selectedMembers.value = newSet;
}

/**
 * Toggle selection for all invitations
 */
function toggleSelectAllInvites(): void {
  selectedInvites.value = allInvitesSelected.value
    ? new Set()
    : new Set(filteredInvites.value.map((i) => i.id));
}

/**
 * Toggle selection for a specific invitation
 * @param inviteId - ID of the invitation to toggle
 */
function toggleInvite(inviteId: string): void {
  const newSet = new Set(selectedInvites.value);
  newSet.has(inviteId) ? newSet.delete(inviteId) : newSet.add(inviteId);
  selectedInvites.value = newSet;
}

// ===== Filter Functions =====

/**
 * Update the selected role for new invitations
 * @param role - The role to select
 */
function selectRole(role: string): void {
  selectedRole.value = role;
}

/**
 * Update the role filter
 * @param role - The role filter to apply
 */
function selectRoleFilter(role: string): void {
  selectedRoleFilter.value = role;
}

/**
 * Update the 2FA filter
 * @param filter - The 2FA filter to apply
 */
function select2FAFilter(filter: string): void {
  selected2FAFilter.value = filter;
}

/**
 * Update the sorting option
 * @param sorting - The sorting option to apply
 */
function selectSorting(sorting: string): void {
  selectedSorting.value = sorting;
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Invite Members Section -->
      <Card
        class="mb-8 overflow-hidden py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>{{ t("members.forms.invite.title") }}</CardTitle>
              <CardDescription>{{
                t("members.forms.invite.description")
              }}</CardDescription>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm text-neutral-600 dark:text-neutral-400">
                {{ t("members.forms.invite.expiry.label") }}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="outline"
                    class="flex items-center gap-2 min-w-32 justify-between"
                  >
                    {{
                      inviteExpiryOptions.find(
                        (o) => o.value === selectedExpiry,
                      )?.label
                    }}
                    <ChevronDown :size="16" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    v-for="option in inviteExpiryOptions"
                    :key="option.value"
                    @click="selectedExpiry = option.value"
                  >
                    {{ option.label }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="w-32 justify-between">
                    {{ roles.find((r) => r.value === selectedRole)?.label }}
                    <ChevronDown :size="16" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    v-for="role in roles"
                    :key="role.value"
                    @click="selectRole(role.value)"
                  >
                    {{ role.label }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                @click="copyInviteLink"
                class="flex items-center gap-2"
              >
                <Check
                  v-if="copiedInviteLink"
                  :size="16"
                  class="text-green-500"
                />
                <Copy v-else :size="16" />
                {{ t("members.forms.invite.copyLink") }}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="flex gap-3">
            <Input
              v-model="inviteEmail"
              type="email"
              :placeholder="t('members.forms.invite.emailPlaceholder')"
              class="flex-1"
              @keyup.enter="sendInvite"
            />
            <Button @click="sendInvite" :disabled="!inviteEmail.trim()">
              {{ t("members.forms.invite.button") }}
            </Button>
          </div>
        </CardContent>
        <CardFooter
          class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
        >
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ t("members.messages.inviteFooter") }}
          </p>
        </CardFooter>
      </Card>

      <!-- Members and Invites -->
      <Card
        class="overflow-hidden py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardHeader>
          <Tabs v-model="activeTab" class="w-full">
            <div class="flex items-center justify-between mb-4">
              <TabsList
                class="dark:bg-neutral-800 dark:border dark:border-neutral-700"
              >
                <TabsTrigger
                  value="members"
                  class="dark:data-[state=active]:bg-neutral-900 dark:data-[state=active]:text-white"
                  >{{ t("members.page.tabs.teamMembers") }}</TabsTrigger
                >
                <TabsTrigger
                  value="invites"
                  class="dark:data-[state=active]:bg-neutral-900 dark:data-[state=active]:text-white"
                  >{{ t("members.page.tabs.pendingInvites") }}</TabsTrigger
                >
              </TabsList>
            </div>
          </Tabs>

          <!-- Search and Filters -->
          <div class="flex gap-3 items-center">
            <div class="relative flex-1">
              <Search
                :size="16"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <Input
                v-model="searchQuery"
                :placeholder="t('members.forms.search.placeholder')"
                class="pl-10 border-neutral-300 dark:border-neutral-700"
              />
            </div>

            <!-- Role Filter -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="outline"
                  class="justify-between min-w-32 border-neutral-300 dark:border-neutral-700"
                >
                  {{
                    roleFilters.find((f) => f.value === selectedRoleFilter)
                      ?.label
                  }}
                  <ChevronDown :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  v-for="filter in roleFilters"
                  :key="filter.value"
                  @click="selectRoleFilter(filter.value)"
                >
                  {{ filter.label }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <!-- 2FA Filter (only for members tab) -->
            <DropdownMenu v-if="activeTab === 'members'">
              <DropdownMenuTrigger as-child>
                <Button
                  variant="outline"
                  class="justify-between min-w-32 border-neutral-300 dark:border-neutral-700"
                >
                  {{
                    twoFAFilters.find((f) => f.value === selected2FAFilter)
                      ?.label
                  }}
                  <ChevronDown :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  v-for="filter in twoFAFilters"
                  :key="filter.value"
                  @click="select2FAFilter(filter.value)"
                >
                  {{ filter.label }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <!-- Sorting -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="outline"
                  class="justify-between min-w-32 border-neutral-300 dark:border-neutral-700"
                >
                  {{
                    sortingOptions.find((o) => o.value === selectedSorting)
                      ?.label || t("members.filters.sortBy")
                  }}
                  <ChevronDown :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  v-for="option in sortingOptions"
                  :key="option.value"
                  @click="selectSorting(option.value)"
                >
                  {{ option.label }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs v-model="activeTab" class="w-full">
            <!-- Members Tab -->
            <TabsContent value="members">
              <MembersTable
                :members="filteredMembers"
                :selected-members="selectedMembers"
                :all-selected="allMembersSelected"
                @remove="openDeleteMemberDialog"
                @toggle-select-all="toggleSelectAllMembers"
                @toggle-member="toggleMember"
                @delete-selected="openDeleteMultipleMembersDialog"
              />
            </TabsContent>

            <!-- Pending Invites Tab -->
            <TabsContent value="invites">
              <InvitesTable
                :invites="filteredInvites"
                :selected-invites="selectedInvites"
                :all-selected="allInvitesSelected"
                @cancel="openCancelInviteDialog"
                @toggle-select-all="toggleSelectAllInvites"
                @toggle-invite="toggleInvite"
                @cancel-selected="openCancelMultipleInvitesDialog"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter
          class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
        >
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ t("members.messages.reviewFooter") }}
          </p>
        </CardFooter>
      </Card>

      <!-- Modals -->
      <DeleteMemberModal
        :open="isDeleteMemberDialogOpen"
        :member="memberToDelete"
        @update:open="isDeleteMemberDialogOpen = $event"
        @confirm="deleteMember"
      />

      <DeleteMultipleMembersModal
        :open="isDeleteMultipleMembersDialogOpen"
        :count="selectedMembers.size"
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
        :count="selectedInvites.size"
        @update:open="isCancelMultipleInvitesDialogOpen = $event"
        @confirm="cancelSelectedInvites"
      />
    </div>
  </div>
</template>
