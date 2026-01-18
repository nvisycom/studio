<template>
  <ToggleGroup v-model="currentTheme" type="single" class="h-8 bg-muted/30 rounded-md p-0.5">
    <ToggleGroupItem value="light" class="h-7 w-9 p-0 data-[state=off]:bg-muted/50 data-[state=on]:bg-background data-[state=on]:shadow-sm">
      <Sun class="w-4 h-4" />
    </ToggleGroupItem>
    <ToggleGroupItem value="dark" class="h-7 w-9 p-0 data-[state=off]:bg-muted/50 data-[state=on]:bg-background data-[state=on]:shadow-sm">
      <Moon class="w-4 h-4" />
    </ToggleGroupItem>
    <ToggleGroupItem value="system" class="h-7 w-9 p-0 data-[state=off]:bg-muted/50 data-[state=on]:bg-background data-[state=on]:shadow-sm">
      <Monitor class="w-4 h-4" />
    </ToggleGroupItem>
  </ToggleGroup>
</template>

<script setup lang="ts">
const colorMode = useColorMode();

const _currentTheme = computed({
	get: () => colorMode.preference as string,
	set: (value: string) => {
		colorMode.preference = value as "light" | "dark" | "system";
	},
});
</script>
