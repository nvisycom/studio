<script setup lang="ts">
import type {
  Member,
  Invite,
  InviteExpiration,
  WorkspaceRole,
} from "@nvisy/sdk";
import { Search, Copy, Check, ChevronDown, Loader2 } from "lucide-vue-next";
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
  pageCategory: "Team",
});

const { t } = useI18n();

// Use SDK composables
const {
  members,
  isLoading: isLoadingMembers,
  removeMemberAsync,
  isRemoving,
} = useMembers();

const {
  invites,
  isLoading: isLoadingInvites,
  sendInviteAsync,
  isSending,
  cancelInviteAsync,
  isCanceling,
  generateCodeAsync,
  isGenerating,
} = useInvites();

// Form State
const inviteEmail = ref<string>("");
const selectedRole = ref<WorkspaceRole>("member");
const selectedExpiry = ref<InviteExpiration>("never");
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
const memberToDelete = ref<Member | null>(null);
const isDeleteMemberDialogOpen = ref<boolean>(false);
const isDeleteMultipleMembersDialogOpen = ref<boolean>(false);
const inviteToCancel = ref<Invite | null>(null);
const isCancelInviteDialogOpen = ref<boolean>(false);
const isCancelMultipleInvitesDialogOpen = ref<boolean>(false);

const roles = computed(() => [
  { value: "guest" as WorkspaceRole, label: t("members.roles.guest") },
  { value: "member" as WorkspaceRole, label: t("members.roles.member") },
  { value: "owner" as WorkspaceRole, label: t("members.roles.owner") },
]);

const roleFilters = computed(() => [
  { value: "anyRole", label: t("members.filters.anyRole") },
  { value: "owner", label: t("members.roles.owner") },
  { value: "member", label: t("members.roles.member") },
  { value: "guest", label: t("members.roles.guest") },
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
  {
    label: t("members.forms.invite.expiry.never"),
    value: "never" as InviteExpiration,
  },
  {
    label: t("members.forms.invite.expiry.24hours"),
    value: "in24Hours" as InviteExpiration,
  },
  {
    label: t("members.forms.invite.expiry.7days"),
    value: "in7Days" as InviteExpiration,
  },
  {
    label: t("members.forms.invite.expiry.30days"),
    value: "in30Days" as InviteExpiration,
  },
]);

// Computed filtered data
const filteredMembers = computed(() => {
  if (!members.value) return [];

  let filtered = members.value.filter((member) => {
    const matchesSearch =
      member.displayName
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      member.emailAddress
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase());
    const matchesRole =
      selectedRoleFilter.value === "anyRole" ||
      member.memberRole === selectedRoleFilter.value;

    return matchesSearch && matchesRole;
  });

  // Sort the results
  if (selectedSorting.value === "name-asc") {
    filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
  } else if (selectedSorting.value === "name-desc") {
    filtered.sort((a, b) => b.displayName.localeCompare(a.displayName));
  } else if (selectedSorting.value === "date-asc") {
    filtered.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  } else if (selectedSorting.value === "date-desc") {
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return filtered;
});

// Filter to only pending invites
const pendingInvites = computed(() => {
  if (!invites.value) return [];
  return invites.value.filter((invite) => invite.inviteStatus === "pending");
});

const filteredInvites = computed(() => {
  let filtered = pendingInvites.value.filter((invite) => {
    const email = invite.emailAddress ?? "";
    const matchesSearch = email
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase());
    const matchesRole =
      selectedRoleFilter.value === "anyRole" ||
      invite.invitedRole === selectedRoleFilter.value;

    return matchesSearch && matchesRole;
  });

  // Sort the results
  if (selectedSorting.value === "name-asc") {
    filtered.sort((a, b) =>
      (a.emailAddress ?? "").localeCompare(b.emailAddress ?? ""),
    );
  } else if (selectedSorting.value === "name-desc") {
    filtered.sort((a, b) =>
      (b.emailAddress ?? "").localeCompare(a.emailAddress ?? ""),
    );
  } else if (selectedSorting.value === "date-asc") {
    filtered.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  } else {
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return filtered;
});

// Computed for selection
const selectableMembers = computed(() =>
  filteredMembers.value.filter((m) => m.memberRole !== "owner"),
);

const allMembersSelected = computed(
  () =>
    selectableMembers.value.length > 0 &&
    selectableMembers.value.every((m) =>
      selectedMembers.value.has(m.accountId),
    ),
);

const allInvitesSelected = computed(
  () =>
    filteredInvites.value.length > 0 &&
    filteredInvites.value.every((i) => selectedInvites.value.has(i.inviteId)),
);

// ===== Invite Functions =====

async function sendInvite(): Promise<void> {
  if (!inviteEmail.value.trim()) return;

  try {
    await sendInviteAsync({
      inviteeEmail: inviteEmail.value,
      invitedRole: selectedRole.value,
      expires: selectedExpiry.value,
    });
    inviteEmail.value = "";
    selectedRole.value = "member";
  } catch (err) {
    console.error("Failed to send invite:", err);
  }
}

async function copyInviteLink(): Promise<void> {
  try {
    const result = await generateCodeAsync({
      invitedRole: selectedRole.value,
      expires: selectedExpiry.value,
    });
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/invite/${result.inviteCode}`;
    await navigator.clipboard.writeText(inviteUrl);
    copiedInviteLink.value = true;
    setTimeout(() => {
      copiedInviteLink.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to generate invite link:", err);
  }
}

// ===== Member Deletion Functions =====

function openDeleteMemberDialog(memberId: string): void {
  const member = members.value?.find((m) => m.accountId === memberId);
  if (member) {
    memberToDelete.value = member;
    isDeleteMemberDialogOpen.value = true;
  }
}

async function deleteMember(): Promise<void> {
  if (!memberToDelete.value) return;

  try {
    await removeMemberAsync(memberToDelete.value.accountId);
    isDeleteMemberDialogOpen.value = false;
    memberToDelete.value = null;
  } catch (err) {
    console.error("Failed to remove member:", err);
  }
}

function openDeleteMultipleMembersDialog(): void {
  isDeleteMultipleMembersDialogOpen.value = true;
}

async function deleteSelectedMembers(): Promise<void> {
  try {
    await Promise.all(
      Array.from(selectedMembers.value).map((accountId) =>
        removeMemberAsync(accountId),
      ),
    );
    selectedMembers.value = new Set();
    isDeleteMultipleMembersDialogOpen.value = false;
  } catch (err) {
    console.error("Failed to remove members:", err);
  }
}

// ===== Invite Cancellation Functions =====

function openCancelInviteDialog(inviteId: string): void {
  const invite = invites.value?.find((i) => i.inviteId === inviteId);
  if (invite) {
    inviteToCancel.value = invite;
    isCancelInviteDialogOpen.value = true;
  }
}

async function cancelInvite(): Promise<void> {
  if (!inviteToCancel.value) return;

  try {
    await cancelInviteAsync(inviteToCancel.value.inviteId);
    isCancelInviteDialogOpen.value = false;
    inviteToCancel.value = null;
  } catch (err) {
    console.error("Failed to cancel invite:", err);
  }
}

function openCancelMultipleInvitesDialog(): void {
  isCancelMultipleInvitesDialogOpen.value = true;
}

async function cancelSelectedInvites(): Promise<void> {
  try {
    await Promise.all(
      Array.from(selectedInvites.value).map((inviteId) =>
        cancelInviteAsync(inviteId),
      ),
    );
    selectedInvites.value = new Set();
    isCancelMultipleInvitesDialogOpen.value = false;
  } catch (err) {
    console.error("Failed to cancel invites:", err);
  }
}

// ===== Selection Functions =====

function toggleSelectAllMembers(): void {
  if (allMembersSelected.value) {
    selectedMembers.value = new Set();
  } else {
    selectedMembers.value = new Set(
      selectableMembers.value.map((m) => m.accountId),
    );
  }
}

function toggleMember(memberId: string): void {
  const newSet = new Set(selectedMembers.value);
  newSet.has(memberId) ? newSet.delete(memberId) : newSet.add(memberId);
  selectedMembers.value = newSet;
}

function toggleSelectAllInvites(): void {
  selectedInvites.value = allInvitesSelected.value
    ? new Set()
    : new Set(filteredInvites.value.map((i) => i.inviteId));
}

function toggleInvite(inviteId: string): void {
  const newSet = new Set(selectedInvites.value);
  newSet.has(inviteId) ? newSet.delete(inviteId) : newSet.add(inviteId);
  selectedInvites.value = newSet;
}

// ===== Filter Functions =====

function selectRole(role: WorkspaceRole): void {
  selectedRole.value = role;
}

function selectRoleFilter(role: string): void {
  selectedRoleFilter.value = role;
}

function select2FAFilter(filter: string): void {
  selected2FAFilter.value = filter;
}

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
              <CardTitle
                class="text-sm font-light tracking-wider uppercase text-neutral-500 dark:text-neutral-400"
                >{{ t("members.forms.invite.title") }}</CardTitle
              >
              <CardDescription>{{
                t("members.forms.invite.description")
              }}</CardDescription>
            </div>
            <div class="flex items-center gap-3">
              <span
                class="text-sm font-light text-neutral-600 dark:text-neutral-400"
              >
                {{ t("members.forms.invite.expiry.label") }}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="outline"
                    class="flex items-center gap-2 min-w-32 justify-between font-normal"
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
                  <Button
                    variant="outline"
                    class="w-32 justify-between font-normal"
                  >
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
                :disabled="isGenerating"
                class="flex items-center gap-2 font-normal"
              >
                <Loader2 v-if="isGenerating" :size="16" class="animate-spin" />
                <Check
                  v-else-if="copiedInviteLink"
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
            <Button
              @click="sendInvite"
              :disabled="!inviteEmail.trim() || isSending"
            >
              <Loader2 v-if="isSending" :size="16" class="mr-2 animate-spin" />
              {{ t("members.forms.invite.button") }}
            </Button>
          </div>
        </CardContent>
        <CardFooter
          class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
        >
          <p class="text-sm font-light text-neutral-600 dark:text-neutral-400">
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
                  class="justify-between min-w-32 border-neutral-300 dark:border-neutral-700 font-normal"
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

            <!-- 2FA Filter (only for members tab) - hidden for now as API doesn't support it yet -->
            <!-- <DropdownMenu v-if="activeTab === 'members'">
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
            </DropdownMenu> -->

            <!-- Sorting -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="outline"
                  class="justify-between min-w-32 border-neutral-300 dark:border-neutral-700 font-normal"
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
              <!-- Loading State -->
              <div
                v-if="isLoadingMembers"
                class="flex items-center justify-center py-12"
              >
                <Loader2 :size="32" class="animate-spin text-neutral-400" />
              </div>

              <MembersTable
                v-else
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
              <!-- Loading State -->
              <div
                v-if="isLoadingInvites"
                class="flex items-center justify-center py-12"
              >
                <Loader2 :size="32" class="animate-spin text-neutral-400" />
              </div>

              <InvitesTable
                v-else
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
          <p class="text-sm font-light text-neutral-600 dark:text-neutral-400">
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
