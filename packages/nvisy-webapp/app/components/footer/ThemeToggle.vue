<script setup lang="ts">
import { Moon, Sun, Monitor } from "lucide-vue-next";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const colorMode = useColorMode();

const themes = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Monitor },
];
</script>

<template>
  <ToggleGroup
    type="single"
    :model-value="colorMode.preference"
    @update:model-value="
      (val) => {
        if (val) colorMode.preference = val as 'light' | 'dark' | 'system';
      }
    "
    variant="outline"
    size="sm"
  >
    <ToggleGroupItem
      v-for="theme in themes"
      :key="theme.value"
      :value="theme.value"
      :aria-label="theme.label"
      class="px-3"
    >
      <component :is="theme.icon" :size="14" />
    </ToggleGroupItem>
  </ToggleGroup>
</template>
