<script setup lang="ts">
import { Languages, Check } from "@lucide/vue";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const { locale, locales, setLocale } = useI18n();

const currentLocale = computed(() => {
	return locales.value.find((i) => i.code === locale.value);
});

type LocaleCode = "en" | "de";

const switchLocale = async (code: LocaleCode) => {
	await setLocale(code);
};
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger
      class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 px-3"
    >
      <Languages />
      <span class="uppercase text-xs">{{ currentLocale?.code }}</span>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        v-for="loc in locales"
        :key="loc.code"
        @click="switchLocale(loc.code as LocaleCode)"
        class="flex items-center justify-between gap-2"
      >
        <span>{{ loc.name }}</span>
        <Check
          v-if="locale === loc.code"
          :size="16"
          class="text-neutral-600 dark:text-neutral-400"
        />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
