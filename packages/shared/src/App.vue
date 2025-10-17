<template>
	<div class="min-h-screen bg-background text-foreground p-8">
		<div class="max-w-2xl mx-auto space-y-8">
			<header class="text-center">
				<h1 class="text-2xl font-bold">@nvisy/shared</h1>
				<p class="text-sm text-muted-foreground">Component Library Development</p>
			</header>

			<main class="space-y-6">
				<section class="bg-card border rounded-lg p-6">
					<h2 class="text-lg font-semibold mb-4">OpenStatus Component</h2>
					<div class="flex items-center justify-center p-4">
						<OpenStatus />
					</div>
				</section>
			</main>
		</div>
	</div>
</template>

<script setup lang="ts">
import OpenStatus from "./components/OpenStatus.vue";
</script>
