<script setup lang="ts">
import {
	ArrowDownToLine,
	FileType,
	LayoutGrid,
	List,
	Search,
	Upload,
} from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { MultiSelect } from "#console/components/ui/multi-select";

/**
 * Files page controls rendered in the app header (upload, search, format filter,
 * list/grid toggle). It reads the shared `useFilesView` state, so the header and
 * the page body stay in sync — the header-content variant for the /files route,
 * alongside the studio's file tabs.
 */
const { t } = useI18n();
const {
	searchQuery,
	selectedFormats,
	viewMode,
	formatOptions,
	openUpload,
	openImport,
} = useFilesView();
</script>

<template>
  <!-- Two groups: upload + search + filter on the left, the view toggle on the
       right. `justify-between` pushes them apart; the search has a capped width
       so it doesn't sprawl across the whole header. The whole bar is a container
       so the action labels collapse to icon-only when the header itself gets
       narrow (chat rail open, smaller window) — not just at a viewport width. -->
  <div class="@container flex w-full min-w-0 items-center justify-between gap-2">
    <!-- Left group: primary action, search, and filter. -->
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <!-- Primary action: the single solid accent in the header. Its label drops
           to an icon-only button once the bar is too narrow to fit it. -->
      <Button
        variant="default"
        size="sm"
        class="h-8 shrink-0"
        data-testid="files-upload"
        :aria-label="t('files.actions.upload')"
        @click="openUpload"
      >
        <Upload :size="16" class="@2xl:mr-2" />
        <span class="hidden @2xl:inline">{{ t("files.actions.upload") }}</span>
      </Button>

      <!-- Import from a connected file service (OneDrive, Dropbox, ...). A quiet
           secondary next to the solid Upload; opens the source-picker dialog. -->
      <Button
        variant="outline"
        size="sm"
        class="h-8 shrink-0"
        data-testid="files-import"
        :aria-label="t('files.actions.import')"
        @click="openImport"
      >
        <ArrowDownToLine :size="16" class="@2xl:mr-2" />
        <span class="hidden @2xl:inline">{{ t("files.actions.import") }}</span>
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

      <!-- Filter: compact icon control. -->
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
