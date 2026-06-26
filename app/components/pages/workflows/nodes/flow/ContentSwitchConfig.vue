<script setup lang="ts">
import { computed, ref } from "vue";
import { Search } from "@lucide/vue";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface ContentTypeConfig {
	id: string;
	label: string;
	enabled: boolean;
}

interface Props {
	data: {
		contentTypes: ContentTypeConfig[];
		invertMode?: boolean;
	};
}

const props = defineProps<Props>();
const emit = defineEmits<{
	update: [data: Record<string, unknown>];
}>();

const search = ref("");

const contentTypes = computed<ContentTypeConfig[]>(
	() => props.data?.contentTypes || [],
);

const filteredContentTypes = computed(() => {
	if (!search.value.trim()) {
		return contentTypes.value;
	}
	const searchLower = search.value.toLowerCase();
	return contentTypes.value.filter((ct) =>
		ct.label.toLowerCase().includes(searchLower),
	);
});

const invertMode = computed(() => props.data?.invertMode ?? false);

function toggleContentType(ctId: string) {
	const updatedContentTypes = contentTypes.value.map((ct) =>
		ct.id === ctId ? { ...ct, enabled: !ct.enabled } : ct,
	);
	emit("update", { ...props.data, contentTypes: updatedContentTypes });
}

function toggleInvertMode() {
	emit("update", { ...props.data, invertMode: !invertMode.value });
}
</script>

<template>
  <div>
    <p class="text-xs text-muted-foreground mb-4">
      Enable content types to create output pins for routing documents by
      content category.
    </p>

    <!-- Invert mode toggle -->
    <button
      type="button"
      class="flex items-center justify-between w-full px-2 py-1.5 mb-3 rounded-md bg-muted/50 hover:bg-accent transition-colors cursor-pointer"
      @click="toggleInvertMode"
    >
      <span class="text-sm">
        {{
          invertMode
            ? "Route unselected content types"
            : "Route selected content types"
        }}
      </span>
      <Switch
        :model-value="invertMode"
        @click.stop
        @update:model-value="toggleInvertMode"
      />
    </button>

    <!-- Search -->
    <div class="relative mb-3">
      <Search
        class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
      />
      <Input
        v-model="search"
        placeholder="Search content types..."
        class="pl-8 h-8 text-sm"
      />
    </div>

    <!-- Content type list -->
    <div class="space-y-1 overflow-y-auto">
      <button
        v-for="ct in filteredContentTypes"
        :key="ct.id"
        type="button"
        class="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
        @click="toggleContentType(ct.id)"
      >
        <span
          class="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground"
        >
          {{ ct.label }}
        </span>
        <Switch
          :model-value="ct.enabled"
          @click.stop
          @update:model-value="toggleContentType(ct.id)"
        />
      </button>
      <p
        v-if="filteredContentTypes.length === 0"
        class="text-sm text-muted-foreground text-center py-2"
      >
        No content types found
      </p>
    </div>
  </div>
</template>
