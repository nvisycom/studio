<script setup lang="ts">
import { ref, onErrorCaptured } from "vue";
import { AlertTriangle } from "lucide-vue-next";

interface Props {
	nodeId: string;
	nodeLabel?: string;
}

const props = defineProps<Props>();

const hasError = ref(false);
const errorMessage = ref("");

onErrorCaptured((error) => {
	hasError.value = true;
	errorMessage.value = error.message || "Unknown error";
	console.error(`Error in node ${props.nodeId}:`, error);
	// Return false to stop propagation
	return false;
});

function retry() {
	hasError.value = false;
	errorMessage.value = "";
}
</script>

<template>
	<div v-if="hasError" class="node-error-boundary">
		<div
			class="flex flex-col items-center justify-center p-4 bg-destructive/10 border border-destructive rounded-lg min-w-[150px]"
		>
			<AlertTriangle class="w-6 h-6 text-destructive mb-2" />
			<span class="text-xs font-medium text-destructive mb-1">
				{{ props.nodeLabel || `Node ${props.nodeId}` }}
			</span>
			<span class="text-xs text-muted-foreground mb-2 text-center max-w-[120px] truncate">
				{{ errorMessage }}
			</span>
			<button
				class="text-xs px-2 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
				@click="retry"
			>
				Retry
			</button>
		</div>
	</div>
	<slot v-else />
</template>
