<script setup lang="ts">
import { computed, ref } from "vue";
import { Search } from "lucide-vue-next";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface ExtensionConfig {
	id: string;
	label: string;
	enabled: boolean;
}

interface Props {
	data: {
		extensions: ExtensionConfig[];
		invertMode?: boolean;
	};
}

const props = defineProps<Props>();
const emit = defineEmits<{
	update: [data: Record<string, unknown>];
}>();

const search = ref("");

const extensions = computed<ExtensionConfig[]>(
	() => props.data?.extensions || [],
);

const filteredExtensions = computed(() => {
	if (!search.value.trim()) {
		return extensions.value;
	}
	const searchLower = search.value.toLowerCase();
	return extensions.value.filter((ext) =>
		ext.label.toLowerCase().includes(searchLower),
	);
});

const invertMode = computed(() => props.data?.invertMode ?? false);

function toggleExtension(extId: string) {
	const updatedExtensions = extensions.value.map((ext) =>
		ext.id === extId ? { ...ext, enabled: !ext.enabled } : ext,
	);
	emit("update", { ...props.data, extensions: updatedExtensions });
}

function toggleInvertMode() {
	emit("update", { ...props.data, invertMode: !invertMode.value });
}
</script>

<template>
  <div>
    <p class="text-xs text-muted-foreground mb-4">
      Enable file extensions to create output pins for routing documents by
      type.
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
            ? "Route unselected extensions"
            : "Route selected extensions"
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
        placeholder="Search extensions..."
        class="pl-8 h-8 text-sm"
      />
    </div>

    <!-- Extension list -->
    <div class="space-y-1 overflow-y-auto">
      <button
        v-for="ext in filteredExtensions"
        :key="ext.id"
        type="button"
        class="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
        @click="toggleExtension(ext.id)"
      >
        <span
          class="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground"
        >
          .{{ ext.label }}
        </span>
        <Switch
          :model-value="ext.enabled"
          @click.stop
          @update:model-value="toggleExtension(ext.id)"
        />
      </button>
      <p
        v-if="filteredExtensions.length === 0"
        class="text-sm text-muted-foreground text-center py-2"
      >
        No extensions found
      </p>
    </div>
  </div>
</template>
