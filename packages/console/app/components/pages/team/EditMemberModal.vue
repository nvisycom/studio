<script setup lang="ts">
import type { Member, WorkspaceRole } from "@nvisy/sdk/datatypes";
import { Loader2 } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";

interface Props {
	open?: boolean;
	member?: Member | null;
	isLoading?: boolean;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(e: "confirm", role: WorkspaceRole): void;
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	member: null,
	isLoading: false,
});

const emit = defineEmits<Emits>();

const { t } = useI18n();

const selectedRole = ref<WorkspaceRole>("member");

// Reset the selected role whenever the member changes or the modal reopens.
watch(
	[() => props.open, () => props.member],
	() => {
		if (props.member) {
			selectedRole.value = props.member.memberRole;
		}
	},
	{ immediate: true },
);

const roles: WorkspaceRole[] = ["admin", "member", "guest"];

const hasChanges = computed(() => {
	return props.member && selectedRole.value !== props.member.memberRole;
});

function handleOpenChange(open: boolean): void {
	emit("update:open", open);
}

function confirm(): void {
	emit("confirm", selectedRole.value);
}

function cancel(): void {
	emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t("members.modals.edit.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("members.modals.edit.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-6">
        <!-- Member Info -->
        <div>
          <label
            class="block text-sm font-medium text-neutral-900 dark:text-white mb-2"
          >
            {{ t("members.modals.edit.memberLabel") }}
          </label>
          <div
            class="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <p class="text-sm text-neutral-900 dark:text-white font-medium">
              {{ member?.displayName }}
            </p>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              {{ member?.emailAddress }}
            </p>
          </div>
        </div>

        <!-- Role Selector -->
        <div>
          <label
            class="block text-sm font-medium text-neutral-900 dark:text-white mb-2"
          >
            {{ t("members.modals.edit.roleLabel") }}
          </label>
          <Select v-model="selectedRole">
            <SelectTrigger class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="role in roles" :key="role" :value="role">
                {{ t(`members.roles.${role}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel" :disabled="isLoading">
          {{ t("common.cancel") }}
        </Button>
        <Button @click="confirm" :disabled="!hasChanges || isLoading">
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("common.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
