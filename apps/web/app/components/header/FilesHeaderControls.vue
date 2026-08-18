<script setup lang="ts">
import {
	FileType,
	LayoutGrid,
	Layers,
	List,
	Search,
	Upload,
} from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { MultiSelect } from "#console/components/ui/multi-select";

/**
 * Files page controls rendered in the app header (upload, search, modality and
 * format filters, list/grid toggle). It reads the shared `useFilesView` state,
 * so the header and the page body stay in sync — the header-content variant for
 * the /files route, alongside the studio's file tabs.
 */
const { t } = useI18n();
const {
	searchQuery,
	selectedModalities,
	selectedFormats,
	viewMode,
	modalityOptions,
	formatOptions,
	openUpload,
} = useFilesView();
</script>

<template>
  <!-- Center a max-w-7xl column to match the files body (same width + centering
       against the full header), so the controls align with the table below. -->
  <div class="mx-auto flex w-full min-w-0 max-w-7xl items-center gap-2">
    <!-- Primary action: the single solid accent in the header. -->
    <Button
      variant="default"
      size="sm"
      class="h-8"
      data-testid="files-upload"
      @click="openUpload"
    >
      <Upload :size="16" class="mr-2" />
      {{ t("files.actions.upload") }}
    </Button>

    <!-- Search: quiet filled field (no hard border), fills the middle. -->
    <div class="relative min-w-0 flex-1">
      <Search
        :size="16"
        class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        v-model="searchQuery"
        :placeholder="t('files.filters.search')"
        class="h-8 border-transparent bg-muted/60 pl-10 shadow-none dark:bg-muted/40"
      />
    </div>

    <!-- Filters + view toggle: compact icon controls. -->
    <MultiSelect
      v-model="selectedModalities"
      :options="modalityOptions"
      :label="t('files.filters.modality')"
      content-class="w-44"
      item-class="capitalize"
      compact
      :icon="Layers"
    />
    <MultiSelect
      v-model="selectedFormats"
      :options="formatOptions"
      :label="t('files.filters.format')"
      searchable
      :search-placeholder="t('files.filters.formatSearch')"
      :empty-text="t('files.filters.noFormats')"
      item-class="font-mono text-xs"
      compact
      :icon="FileType"
    />

    <!-- View toggle: light icon buttons, no surrounding border box. -->
    <div class="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon-sm"
        class="size-8"
        :class="{ 'bg-muted text-foreground': viewMode === 'list' }"
        :aria-label="t('files.view.list')"
        @click="viewMode = 'list'"
      >
        <List :size="16" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        class="size-8"
        :class="{ 'bg-muted text-foreground': viewMode === 'grid' }"
        :aria-label="t('files.view.grid')"
        @click="viewMode = 'grid'"
      >
        <LayoutGrid :size="16" />
      </Button>
    </div>
  </div>
</template>
