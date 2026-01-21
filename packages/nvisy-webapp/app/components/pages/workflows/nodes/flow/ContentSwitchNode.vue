<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { FileType } from "lucide-vue-next";

interface ContentTypeConfig {
	id: string;
	label: string;
	enabled: boolean;
}

interface Props {
	data: {
		label: string;
		contentTypes: ContentTypeConfig[];
		invertMode?: boolean;
	};
	selected?: boolean;
}

const props = defineProps<Props>();

const enabledContentTypes = computed(() => {
	return props.data?.contentTypes?.filter((ct) => ct.enabled) || [];
});

const displayLimit = 3;
const displayedContentTypes = computed(() =>
	enabledContentTypes.value.slice(0, displayLimit),
);
const remainingCount = computed(() =>
	Math.max(0, enabledContentTypes.value.length - displayLimit),
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
        <FileType class="w-4 h-4" />
      </div>
      <span class="workflow-node__label">{{
        props.data?.label || "Content Switch"
      }}</span>
    </div>

    <div v-if="enabledContentTypes.length > 0" class="workflow-node__tags">
      <span
        v-if="invertMode"
        class="workflow-node__tag workflow-node__tag--muted"
      >
        NOT
      </span>
      <span
        v-for="ct in displayedContentTypes"
        :key="ct.id"
        class="workflow-node__tag"
      >
        {{ ct.label }}
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
