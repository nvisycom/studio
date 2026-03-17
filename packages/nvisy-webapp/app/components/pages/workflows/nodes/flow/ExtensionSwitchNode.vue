<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { Split } from "lucide-vue-next";

interface ExtensionConfig {
	id: string;
	label: string;
	enabled: boolean;
}

interface Props {
	data: {
		label: string;
		extensions: ExtensionConfig[];
		invertMode?: boolean;
	};
	selected?: boolean;
}

const props = defineProps<Props>();

const enabledExtensions = computed(() => {
	return props.data?.extensions?.filter((ext) => ext.enabled) || [];
});

const displayLimit = 3;
const displayedExtensions = computed(() =>
	enabledExtensions.value.slice(0, displayLimit),
);
const remainingCount = computed(() =>
	Math.max(0, enabledExtensions.value.length - displayLimit),
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
        <Split class="w-4 h-4" />
      </div>
      <span class="workflow-node__label">{{
        props.data?.label || "Extension Switch"
      }}</span>
    </div>

    <div v-if="enabledExtensions.length > 0" class="workflow-node__tags">
      <span
        v-if="invertMode"
        class="workflow-node__tag workflow-node__tag--muted"
      >
        NOT
      </span>
      <span
        v-for="ext in displayedExtensions"
        :key="ext.id"
        class="workflow-node__tag"
      >
        .{{ ext.label }}
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
