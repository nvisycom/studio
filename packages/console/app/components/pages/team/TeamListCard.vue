<script setup lang="ts">
import type {
	Member,
	Invite,
	MemberSortField,
	InviteSortField,
	SortOrder,
	WorkspaceRole,
} from "@nvisy/sdk/datatypes";
import type { Selection } from "#console/composables/useSelection";
import { Search, Loader2 } from "@lucide/vue";
import { Input } from "#console/components/ui/input";
import { MembersTable, InvitesTable } from "#console/components/pages/team";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "#console/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "#console/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";

defineProps<{
	members: Member[];
	invites: Invite[];
	isLoadingMembers: boolean;
	isLoadingInvites: boolean;
	membersSelection: Selection;
	invitesSelection: Selection;
}>();

const emit = defineEmits<{
	"update:searchQuery": [query: string];
	"update:roleFilter": [role: WorkspaceRole | null];
	"update:sorting": [
		sortBy: MemberSortField | InviteSortField,
		order: SortOrder,
	];
	removeMember: [memberId: string];
	editMember: [memberId: string];
	cancelInvite: [inviteId: string];
	deleteSelectedMembers: [];
	cancelSelectedInvites: [];
}>();

const { t } = useI18n();

const activeTab = ref("members");
const searchQuery = ref("");
const selectedRoleFilter = ref<WorkspaceRole | null>(null);
const selectedSortField = ref<MemberSortField | InviteSortField>("date");
const selectedSortOrder = ref<SortOrder>("desc");

// `Select` binds a single string, so the role filter uses an "any" sentinel and
// sorting encodes field + order as "field|order".
const ANY_ROLE = "any";

const roleFilters = computed(() => [
	{ value: ANY_ROLE, label: t("members.filters.anyRole") },
	{ value: "owner" as WorkspaceRole, label: t("members.roles.owner") },
	{ value: "admin" as WorkspaceRole, label: t("members.roles.admin") },
	{ value: "member" as WorkspaceRole, label: t("members.roles.member") },
	{ value: "guest" as WorkspaceRole, label: t("members.roles.guest") },
]);

const sortingOptions = computed(() => [
	{ value: "name|asc", label: t("members.filters.sorting.nameAsc") },
	{ value: "name|desc", label: t("members.filters.sorting.nameDesc") },
	{ value: "date|desc", label: t("members.filters.sorting.dateNewest") },
	{ value: "date|asc", label: t("members.filters.sorting.dateOldest") },
]);

const roleFilterValue = computed({
	get: () => selectedRoleFilter.value ?? ANY_ROLE,
	set: (value: string) => {
		selectedRoleFilter.value =
			value === ANY_ROLE ? null : (value as WorkspaceRole);
	},
});

const sortingValue = computed({
	get: () => `${selectedSortField.value}|${selectedSortOrder.value}`,
	set: (value: string) => {
		const [sortBy, order] = value.split("|") as [
			MemberSortField | InviteSortField,
			SortOrder,
		];
		selectedSortField.value = sortBy;
		selectedSortOrder.value = order;
		emit("update:sorting", sortBy, order);
	},
});

watch(searchQuery, (query) => emit("update:searchQuery", query));
watch(selectedRoleFilter, (role) => emit("update:roleFilter", role));
</script>

<template>
  <Card class="overflow-hidden rounded-xl border-border/50 py-0 pt-6">
    <CardHeader>
      <Tabs v-model="activeTab" class="mb-4 w-full">
        <TabsList>
          <TabsTrigger value="members">
            {{ t("members.page.tabs.teamMembers") }}
          </TabsTrigger>
          <TabsTrigger value="invites">
            {{ t("members.page.tabs.pendingInvites") }}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <!-- Search and Filters -->
      <div class="flex items-center gap-3">
        <div class="relative flex-1">
          <Search
            :size="16"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="searchQuery"
            :placeholder="t('members.forms.search.placeholder')"
            class="pl-10"
          />
        </div>

        <!-- Role Filter -->
        <Select v-model="roleFilterValue">
          <SelectTrigger class="h-9 w-[160px] text-sm">
            <SelectValue :placeholder="t('members.filters.anyRole')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="filter in roleFilters"
              :key="filter.value"
              :value="filter.value"
              class="text-sm font-normal"
            >
              {{ filter.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Sorting -->
        <Select v-model="sortingValue">
          <SelectTrigger class="h-9 w-[160px] text-sm">
            <SelectValue :placeholder="t('members.filters.sortBy')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in sortingOptions"
              :key="option.value"
              :value="option.value"
              class="text-sm font-normal"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardHeader>
    <CardContent>
      <!-- Members Tab -->
      <div v-if="activeTab === 'members'">
        <div
          v-if="isLoadingMembers"
          class="flex items-center justify-center py-12"
        >
          <Loader2 :size="24" class="animate-spin text-muted-foreground" />
        </div>

        <MembersTable
          v-else
          :members="members"
          :selection="membersSelection"
          @remove="emit('removeMember', $event)"
          @edit="emit('editMember', $event)"
          @delete-selected="emit('deleteSelectedMembers')"
        />
      </div>

      <!-- Pending Invites Tab -->
      <div v-else>
        <div
          v-if="isLoadingInvites"
          class="flex items-center justify-center py-12"
        >
          <Loader2 :size="24" class="animate-spin text-muted-foreground" />
        </div>

        <InvitesTable
          v-else
          :invites="invites"
          :selection="invitesSelection"
          @cancel="emit('cancelInvite', $event)"
          @cancel-selected="emit('cancelSelectedInvites')"
        />
      </div>
    </CardContent>
    <CardFooter
      class="rounded-b-xl border-t border-border/50 bg-muted/30 pb-6"
    >
      <p class="text-xs text-muted-foreground">
        {{ t("members.messages.reviewFooter") }}
      </p>
    </CardFooter>
  </Card>
</template>
