<script setup lang="ts">
import { computed } from "vue";
import { Moon, Sun, Monitor } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const colorMode = useColorMode();

const themes = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Monitor },
];

const currentTheme = computed(() => {
	return themes.find((t) => t.value === colorMode.preference) || themes[0];
});

function setTheme(theme: "light" | "dark" | "system") {
	colorMode.preference = theme;
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="sm" class="h-8 gap-2">
        <component :is="currentTheme.icon" :size="14" />
        <span>{{ currentTheme.label }}</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        v-for="theme in themes"
        :key="theme.value"
        @click="setTheme(theme.value as 'light' | 'dark' | 'system')"
        :class="colorMode.preference === theme.value ? 'bg-accent' : ''"
      >
        <component :is="theme.icon" :size="16" class="mr-2" />
        {{ theme.label }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
