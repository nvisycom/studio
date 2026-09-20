<script setup lang="ts">
import { Check, Plus } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#console/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#console/components/ui/command";
import EntityAvatar from "#console/components/avatar/EntityAvatar.vue";

/**
 * A reviewer picker for assigning a document's review. Selecting a candidate
 * emits their account id (what `assignReview` takes) — a workspace member's
 * `id` is their account id.
 */
const props = defineProps<{
	/** Account ids already assigned, to mark as selected. */
	assigned: string[];
	/** Whether an assign request is in flight (disables the trigger). */
	loading?: boolean;
}>();

const emit = defineEmits<{
	/** A reviewer was chosen — their account id. */
	select: [accountId: string];
}>();

const { t } = useI18n();
const { members, isLoading } = useMembers();
const { resolveAvatarUrl } = useAvatarUrl();

const open = ref(false);
const assignedSet = computed(() => new Set(props.assigned));

// Any workspace member can be assigned a review; their `id` is their account id.
const candidates = computed(() =>
	(members.value ?? []).map((m) => ({
		id: m.id,
		name: personLabel(m),
		username: m.username,
		avatarUrl: m.avatarUrl,
	})),
);

function choose(accountId: string) {
	if (assignedSet.value.has(accountId)) return;
	emit("select", accountId);
	open.value = false;
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm" class="h-7 gap-1.5" :disabled="loading">
        <Plus :size="14" />
        {{ t("reviews.assign") }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-64 p-0" align="end">
      <Command>
        <CommandInput :placeholder="t('reviews.picker.search')" />
        <CommandList>
          <CommandEmpty>
            {{ isLoading ? t("reviews.picker.loading") : t("reviews.picker.empty") }}
          </CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="candidate in candidates"
              :key="candidate.id"
              :value="`${candidate.name} ${candidate.username}`"
              class="gap-2"
              @select="choose(candidate.id)"
            >
              <EntityAvatar
                size="sm"
                :name="candidate.name"
                :src="resolveAvatarUrl(candidate.avatarUrl)"
              />
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate text-sm">{{ candidate.name }}</span>
                <span class="truncate text-xs text-muted-foreground">
                  {{ candidate.username }}
                </span>
              </span>
              <Check
                v-if="assignedSet.has(candidate.id)"
                :size="14"
                class="shrink-0 text-muted-foreground"
              />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
