<script setup lang="ts">
import type {
	Member,
	Invite,
	MemberSortField,
	InviteSortField,
	SortOrder,
	WorkspaceRole,
} from "@nvisy/sdk/datatypes";
import { Search, ChevronDown, Loader2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MembersTable, InvitesTable } from "~/components/pages/team";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const props = defineProps<{
	members: Member[];
	invites: Invite[];
	isLoadingMembers: boolean;
	isLoadingInvites: boolean;
	selectedMembers: Set<string>;
	selectedInvites: Set<string>;
	allMembersSelected: boolean;
	allInvitesSelected: boolean;
}>();

const emit = defineEmits<{
	"update:activeTab": [tab: string];
	"update:searchQuery": [query: string];
	"update:roleFilter": [role: WorkspaceRole | null];
	"update:sorting": [
		sortBy: MemberSortField | InviteSortField,
		order: SortOrder,
	];
	removeMember: [memberId: string];
	cancelInvite: [inviteId: string];
	toggleSelectAllMembers: [];
	toggleMember: [memberId: string];
	deleteSelectedMembers: [];
	toggleSelectAllInvites: [];
	toggleInvite: [inviteId: string];
	cancelSelectedInvites: [];
}>();

const { t } = useI18n();

const activeTab = ref("members");
const searchQuery = ref("");
const selectedRoleFilter = ref<WorkspaceRole | null>(null);
const selectedSortField = ref<MemberSortField | InviteSortField>("date");
const selectedSortOrder = ref<SortOrder>("desc");

const roleFilters = computed(() => [
	{ value: null, label: t("members.filters.anyRole") },
	{ value: "owner" as WorkspaceRole, label: t("members.roles.owner") },
	{ value: "admin" as WorkspaceRole, label: t("members.roles.admin") },
	{ value: "member" as WorkspaceRole, label: t("members.roles.member") },
	{ value: "guest" as WorkspaceRole, label: t("members.roles.guest") },
]);

const sortingOptions = computed(() => [
	{
		label: t("members.filters.sorting.nameAsc"),
		sortBy: "name" as const,
		order: "asc" as const,
	},
	{
		label: t("members.filters.sorting.nameDesc"),
		sortBy: "name" as const,
		order: "desc" as const,
	},
	{
		label: t("members.filters.sorting.dateNewest"),
		sortBy: "date" as const,
		order: "desc" as const,
	},
	{
		label: t("members.filters.sorting.dateOldest"),
		sortBy: "date" as const,
		order: "asc" as const,
	},
]);

const currentSortLabel = computed(() => {
	const option = sortingOptions.value.find(
		(o) =>
			o.sortBy === selectedSortField.value &&
			o.order === selectedSortOrder.value,
	);
	return option?.label ?? t("members.filters.sortBy");
});

const currentRoleFilterLabel = computed(() => {
	const filter = roleFilters.value.find(
		(f) => f.value === selectedRoleFilter.value,
	);
	return filter?.label ?? t("members.filters.anyRole");
});

watch(activeTab, (tab) => emit("update:activeTab", tab));
watch(searchQuery, (query) => emit("update:searchQuery", query));
watch(selectedRoleFilter, (role) => emit("update:roleFilter", role));

function selectSorting(
	sortBy: MemberSortField | InviteSortField,
	order: SortOrder,
) {
	selectedSortField.value = sortBy;
	selectedSortOrder.value = order;
	emit("update:sorting", sortBy, order);
}
</script>

<template>
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
            class="pl-10 border-neutral-300 dark:border-neutral-700 font-light"
          />
        </div>

        <!-- Role Filter -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="outline"
              class="justify-between min-w-32 border-neutral-300 dark:border-neutral-700 font-light"
            >
              {{ currentRoleFilterLabel }}
              <ChevronDown :size="16" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              v-for="filter in roleFilters"
              :key="filter.value ?? 'any'"
              @click="selectedRoleFilter = filter.value"
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
              class="justify-between min-w-32 border-neutral-300 dark:border-neutral-700 font-light"
            >
              {{ currentSortLabel }}
              <ChevronDown :size="16" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              v-for="option in sortingOptions"
              :key="`${option.sortBy}-${option.order}`"
              @click="selectSorting(option.sortBy, option.order)"
            >
              {{ option.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
    <CardContent>
      <!-- Members Tab -->
      <div v-if="activeTab === 'members'">
        <div
          v-if="isLoadingMembers"
          class="flex items-center justify-center py-12"
        >
          <Loader2 :size="32" class="animate-spin text-neutral-400" />
        </div>

        <MembersTable
          v-else
          :members="members"
          :selected-members="selectedMembers"
          :all-selected="allMembersSelected"
          @remove="emit('removeMember', $event)"
          @toggle-select-all="emit('toggleSelectAllMembers')"
          @toggle-member="emit('toggleMember', $event)"
          @delete-selected="emit('deleteSelectedMembers')"
        />
      </div>

      <!-- Pending Invites Tab -->
      <div v-else>
        <div
          v-if="isLoadingInvites"
          class="flex items-center justify-center py-12"
        >
          <Loader2 :size="32" class="animate-spin text-neutral-400" />
        </div>

        <InvitesTable
          v-else
          :invites="invites"
          :selected-invites="selectedInvites"
          :all-selected="allInvitesSelected"
          @cancel="emit('cancelInvite', $event)"
          @toggle-select-all="emit('toggleSelectAllInvites')"
          @toggle-invite="emit('toggleInvite', $event)"
          @cancel-selected="emit('cancelSelectedInvites')"
        />
      </div>
    </CardContent>
    <CardFooter
      class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
    >
      <p class="text-sm font-light text-neutral-600 dark:text-neutral-400">
        {{ t("members.messages.reviewFooter") }}
      </p>
    </CardFooter>
  </Card>
</template>
