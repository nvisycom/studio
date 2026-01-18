<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="sm" class="h-9 text-sm font-normal min-w-[140px] justify-between">
        <span>{{ currentLanguageLabel }}</span>
        <ChevronDown class="w-3 h-3 ml-1" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-36">
      <DropdownMenuItem @click="setLocale('en')">
        English
      </DropdownMenuItem>
      <DropdownMenuItem @click="setLocale('de')">
        Deutsch
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
const { locale, setLocale } = useI18n();

const currentLanguageLabel = computed(() => {
	return locale.value === "de" ? "Deutsch" : "English";
});
</script>
