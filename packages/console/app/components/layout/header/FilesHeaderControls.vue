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
  <!-- Two groups: upload + search + filters on the left, the view toggle on the
       right. `justify-between` pushes them apart; the search has a capped width
       so it doesn't sprawl across the whole header. -->
  <div class="flex w-full min-w-0 items-center justify-between gap-2">
    <!-- Left group: primary action, search, and filters. -->
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <!-- Primary action: the single solid accent in the header. Collapses to an
           icon-only button on small screens to save space. -->
      <Button
        variant="default"
        size="sm"
        class="h-8 shrink-0"
        data-testid="files-upload"
        :aria-label="t('files.actions.upload')"
        @click="openUpload"
      >
        <Upload :size="16" class="sm:mr-2" />
        <span class="hidden sm:inline">{{ t("files.actions.upload") }}</span>
      </Button>

      <!-- Search: quiet filled field (no hard border), capped so it doesn't take
           the full header width. -->
      <div class="relative min-w-0 max-w-xs flex-1">
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

      <!-- Filters: compact icon controls. -->
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
    </div>

    <!-- Right group: view toggle (light icon buttons, no surrounding border). -->
    <div class="flex shrink-0 items-center gap-0.5">
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
