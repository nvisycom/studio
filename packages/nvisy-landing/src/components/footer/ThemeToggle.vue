<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Sun, Moon, Monitor } from "@lucide/vue";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Theme = "light" | "dark" | "system";

const theme = ref<Theme>("system");

function updateThemeColor(dark: boolean) {
	const metaThemeColor = document.querySelector('meta[name="theme-color"]');
	if (metaThemeColor) {
		metaThemeColor.setAttribute("content", dark ? "#000000" : "#ffffff");
	}
}

function applyTheme(newTheme: Theme) {
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const shouldBeDark =
		newTheme === "dark" || (newTheme === "system" && prefersDark);

	if (shouldBeDark) {
		document.documentElement.classList.add("dark");
	} else {
		document.documentElement.classList.remove("dark");
	}

	updateThemeColor(shouldBeDark);
}

function initTheme() {
	const stored = localStorage.getItem("theme") as Theme | null;
	theme.value = stored || "system";
	applyTheme(theme.value);
}

function setTheme(newTheme: Theme) {
	theme.value = newTheme;
	localStorage.setItem("theme", newTheme);
	applyTheme(newTheme);
}

onMounted(() => {
	initTheme();

	// Listen for system theme changes
	window
		.matchMedia("(prefers-color-scheme: dark)")
		.addEventListener("change", () => {
			if (theme.value === "system") {
				applyTheme("system");
			}
		});
});
</script>

<template>
  <ToggleGroup
    type="single"
    :model-value="theme"
    @update:model-value="(val) => val && setTheme(val as Theme)"
    class="bg-neutral-100 dark:bg-neutral-900"
  >
    <ToggleGroupItem value="light" aria-label="Light mode" class="px-3">
      <Sun class="w-4 h-4" />
    </ToggleGroupItem>
    <ToggleGroupItem value="system" aria-label="System theme" class="px-3">
      <Monitor class="w-4 h-4" />
    </ToggleGroupItem>
    <ToggleGroupItem value="dark" aria-label="Dark mode" class="px-3">
      <Moon class="w-4 h-4" />
    </ToggleGroupItem>
  </ToggleGroup>
</template>
