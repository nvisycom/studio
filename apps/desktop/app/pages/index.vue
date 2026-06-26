<script setup lang="ts">
// Proof the shared console layer is reusable here: Button is auto-imported
// from @nvisy/console, and the theme/composables come from the layer too.
import { Button } from "#console/components/ui/button";
</script>

<template>
	<main class="flex min-h-screen flex-col items-center justify-center gap-4">
		<h1 class="font-semibold text-2xl">Nvisy Desktop</h1>
		<p class="text-muted-foreground text-sm">
			Tauri shell · shared @nvisy/console layer
		</p>
		<Button>It works</Button>
	</main>
</template>
