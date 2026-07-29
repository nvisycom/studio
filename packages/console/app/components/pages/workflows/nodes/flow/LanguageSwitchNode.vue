<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import { Languages } from "@lucide/vue";

interface LanguageConfig {
	id: string;
	label: string;
	code: string;
	enabled: boolean;
}

interface Props {
	data: {
		label: string;
		languages: LanguageConfig[];
		invertMode?: boolean;
	};
	selected?: boolean;
}

const props = defineProps<Props>();

const enabledLanguages = computed(() => {
	return props.data?.languages?.filter((lang) => lang.enabled) || [];
});

const displayLimit = 3;
const displayedLanguages = computed(() =>
	enabledLanguages.value.slice(0, displayLimit),
);
const remainingCount = computed(() =>
	Math.max(0, enabledLanguages.value.length - displayLimit),
);

const invertMode = computed(() => props.data?.invertMode ?? false);
</script>

<template>
  <div
    class="workflow-node workflow-node--switch"
    :class="{ 'workflow-node--selected': selected }"
  >
    <Handle type="target" :position="Position.Left" />

    <div class="workflow-node__header">
      <div class="workflow-node__icon">
        <Languages class="w-4 h-4" />
      </div>
      <span class="workflow-node__label">{{
        props.data?.label || "Language Switch"
      }}</span>
    </div>

    <div v-if="enabledLanguages.length > 0" class="workflow-node__tags">
      <span
        v-if="invertMode"
        class="workflow-node__tag workflow-node__tag--muted"
      >
        NOT
      </span>
      <span
        v-for="lang in displayedLanguages"
        :key="lang.id"
        class="workflow-node__tag"
      >
        {{ lang.code.toUpperCase() }}
      </span>
      <span
        v-if="remainingCount > 0"
        class="workflow-node__tag workflow-node__tag--muted"
      >
        +{{ remainingCount }}
      </span>
    </div>

    <!-- Two outputs: true (match) and false (no match) -->
    <Handle
      id="true"
      type="source"
      :position="Position.Right"
      :style="{ top: '35%', transform: 'translate(50%, -50%)' }"
    />
    <Handle
      id="false"
      type="source"
      :position="Position.Right"
      :style="{ top: '65%', transform: 'translate(50%, -50%)' }"
    />
  </div>
</template>
