<script setup lang="ts">
import { computed, ref } from "vue";
import { Search } from "lucide-vue-next";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface LanguageConfig {
	id: string;
	label: string;
	code: string;
	enabled: boolean;
}

interface Props {
	data: {
		languages: LanguageConfig[];
		invertMode?: boolean;
	};
}

const props = defineProps<Props>();
const emit = defineEmits<{
	update: [data: Record<string, unknown>];
}>();

const search = ref("");

const languages = computed<LanguageConfig[]>(() => props.data?.languages || []);

const filteredLanguages = computed(() => {
	if (!search.value.trim()) {
		return languages.value;
	}
	const searchLower = search.value.toLowerCase();
	return languages.value.filter(
		(lang) =>
			lang.label.toLowerCase().includes(searchLower) ||
			lang.code.toLowerCase().includes(searchLower),
	);
});

const invertMode = computed(() => props.data?.invertMode ?? false);

function toggleLanguage(langId: string) {
	const updatedLanguages = languages.value.map((lang) =>
		lang.id === langId ? { ...lang, enabled: !lang.enabled } : lang,
	);
	emit("update", { ...props.data, languages: updatedLanguages });
}

function toggleInvertMode() {
	emit("update", { ...props.data, invertMode: !invertMode.value });
}
</script>

<template>
  <div>
    <p class="text-xs text-muted-foreground mb-4">
      Enable languages to create output pins for routing documents by detected
      language.
    </p>

    <!-- Invert mode toggle -->
    <button
      type="button"
      class="flex items-center justify-between w-full px-2 py-1.5 mb-3 rounded-md bg-muted/50 hover:bg-accent transition-colors cursor-pointer"
      @click="toggleInvertMode"
    >
      <span class="text-sm">
        {{
          invertMode ? "Route unselected languages" : "Route selected languages"
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
        placeholder="Search languages..."
        class="pl-8 h-8 text-sm"
      />
    </div>

    <!-- Language list -->
    <div class="space-y-1 overflow-y-auto">
      <button
        v-for="lang in filteredLanguages"
        :key="lang.id"
        type="button"
        class="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
        @click="toggleLanguage(lang.id)"
      >
        <span class="flex items-center gap-2">
          <span
            class="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
          >
            {{ lang.code.toUpperCase() }}
          </span>
          <span class="text-sm">{{ lang.label }}</span>
        </span>
        <Switch
          :model-value="lang.enabled"
          @click.stop
          @update:model-value="toggleLanguage(lang.id)"
        />
      </button>
      <p
        v-if="filteredLanguages.length === 0"
        class="text-sm text-muted-foreground text-center py-2"
      >
        No languages found
      </p>
    </div>
  </div>
</template>
