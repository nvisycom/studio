<script setup lang="ts">
import { X } from "@lucide/vue";

/**
 * A free-form tag input: type a word and press space, comma, or Enter to turn
 * it into a chip; Backspace on an empty input removes the last chip. The model
 * is the comma-separated string the rest of the editor already stores, so it
 * drops in wherever a plain tags Input was used.
 */
const { t } = useI18n();

defineOptions({ inheritAttrs: false });

const model = defineModel<string>({ default: "" });

withDefaults(defineProps<{ placeholder?: string }>(), {});

// The chips, derived from the comma-separated model.
const tags = computed(() =>
	model.value
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean),
);

const draft = ref("");

function setTags(next: string[]) {
	model.value = next.join(", ");
}

// Commit the current draft as a tag (deduped, non-empty).
function commit() {
	const value = draft.value.trim();
	draft.value = "";
	if (!value || tags.value.includes(value)) return;
	setTags([...tags.value, value]);
}

function remove(tag: string) {
	setTags(tags.value.filter((t) => t !== tag));
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === "Enter" || event.key === ",") {
		event.preventDefault();
		commit();
	} else if (event.key === " " && draft.value.trim()) {
		event.preventDefault();
		commit();
	} else if (event.key === "Backspace" && !draft.value && tags.value.length) {
		setTags(tags.value.slice(0, -1));
	}
}
</script>

<template>
  <div
    class="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
  >
    <span
      v-for="tag in tags"
      :key="tag"
      class="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-mono text-xs font-normal text-secondary-foreground"
    >
      {{ tag }}
      <button
        type="button"
        class="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
        :aria-label="t('common.tagInput.remove', { tag })"
        @click="remove(tag)"
      >
        <X :size="13" />
      </button>
    </span>
    <input
      v-model="draft"
      v-bind="$attrs"
      type="text"
      class="h-6 min-w-24 flex-1 bg-transparent font-mono text-sm outline-none placeholder:font-sans placeholder:text-muted-foreground"
      :placeholder="tags.length ? '' : (placeholder ?? t('common.tagInput.placeholder'))"
      @keydown="onKeydown"
      @blur="commit"
    />
  </div>
</template>
