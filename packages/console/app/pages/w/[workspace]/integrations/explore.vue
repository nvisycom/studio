<script setup lang="ts">
import { Search, ArrowLeft, Filter, ArrowUpDown, Puzzle } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import {
	ProviderCard,
	ConnectConnectionDialog,
	ConnectLlmDialog,
	ConnectFileServiceDialog,
} from "#console/components/pages/integrations";
import { HeaderSocket, SectionTabs } from "#console/components/layout/header";

const { t } = useI18n();
const { wLink } = useWorkspaceLink();
const sectionTabs = useSectionTabs();

useHead({ title: "Explore Providers" });

definePageMeta({
	pageCategory: "header.category.integrations",
	hideCategory: true,
});

// Filters, availability, and the mapped card lists.
const {
	searchQuery,
	statusFilter,
	sortBy,
	hasActiveFilters,
	connectableCards,
	recommendationCards,
	noResults,
	pills,
	isPillActive,
	togglePill,
	clearAllFilters,
} = useExploreProviders();

// Connect flow: dialog state, routing, and the connect submits.
const {
	connect,
	seed,
	storageOpen,
	storageProvider,
	llmOpen,
	llmProvider,
	fileServiceOpen,
	fileServiceProvider,
	submitCredentials,
	submitOAuth,
	isCreating,
	isStartingOAuth,
} = useConnectProvider();
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-6xl mx-auto w-full">
      <!-- Section tabs in the app-header socket. -->
      <HeaderSocket>
        <SectionTabs :tabs="sectionTabs.integrations.value" />
      </HeaderSocket>

      <!-- Header with Back Button and Search -->
      <div
        class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6"
      >
        <Button as-child variant="outline" class="font-normal">
          <NuxtLink :to="wLink('/integrations')" class="flex items-center gap-2">
            <ArrowLeft :size="16" />
            {{ t("connections.actions.backToConnections") }}
          </NuxtLink>
        </Button>

        <div class="relative flex-1">
          <Search
            :size="16"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="searchQuery"
            :placeholder="t('connections.forms.search.placeholder')"
            class="pl-10 h-9"
          />
        </div>

        <Select v-model="statusFilter">
          <SelectTrigger class="w-[160px] h-9 text-sm">
            <Filter :size="14" class="mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" class="text-sm font-normal">
              {{ t("connections.explore.filters.allStatus") }}
            </SelectItem>
            <SelectItem value="available" class="text-sm font-normal">
              {{ t("connections.explore.filters.availableOnly") }}
            </SelectItem>
            <SelectItem value="unavailable" class="text-sm font-normal">
              {{ t("connections.explore.filters.unavailableOnly") }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="sortBy">
          <SelectTrigger class="w-[180px] h-9 text-sm">
            <ArrowUpDown :size="14" class="mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nameAsc" class="text-sm font-normal">
              {{ t("connections.explore.sorting.nameAsc") }}
            </SelectItem>
            <SelectItem value="nameDesc" class="text-sm font-normal">
              {{ t("connections.explore.sorting.nameDesc") }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Category Pills (Multi-select). Selected = solid (strongest); hover on
           an unselected pill is a quiet muted fill that never out-shouts the
           selected state; focus rings are suppressed so a just-clicked pill
           doesn't look louder than the selection. The "All" pill clears the
           selection (an empty set = all). -->
      <div class="flex flex-wrap gap-2 mb-8">
        <button
          v-for="pill in pills"
          :key="pill.key"
          type="button"
          :aria-pressed="isPillActive(pill.key)"
          :class="[
            'inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm font-normal transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            isPillActive(pill.key)
              ? 'border-foreground bg-foreground text-background hover:bg-foreground/90'
              : 'border-border bg-background text-foreground hover:bg-muted',
          ]"
          @click="togglePill(pill.key)"
        >
          <component :is="pill.icon" v-if="pill.icon" :size="14" />
          {{ pill.label }}
          <span class="text-xs opacity-60">{{ pill.count }}</span>
        </button>
      </div>

      <!-- No results in either region. -->
      <div v-if="noResults" class="py-12 text-center">
        <div
          class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
        >
          <Puzzle class="size-5 text-muted-foreground" />
        </div>
        <p class="text-sm text-foreground mb-1">
          {{ t("connections.explore.noResults") }}
        </p>
        <p class="text-xs text-muted-foreground mb-4">
          {{ t("connections.explore.noResultsHint") }}
        </p>
        <Button
          v-if="hasActiveFilters"
          variant="outline"
          size="sm"
          @click="clearAllFilters"
        >
          {{ t("connections.explore.clearFilters") }}
        </Button>
      </div>

      <template v-else>
        <!-- Connectable region: services enabled in the console. -->
        <section v-if="connectableCards.length > 0" class="mb-10">
          <div class="mb-4">
            <h2 class="text-sm font-medium text-foreground">
              {{ t("connections.explore.sections.connect.title") }}
            </h2>
            <p class="mt-0.5 text-xs text-muted-foreground">
              {{ t("connections.explore.sections.connect.description") }}
            </p>
          </div>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <ProviderCard
              v-for="card in connectableCards"
              :key="card.id"
              :provider="card"
              @connect="connect"
            />
          </div>
        </section>

        <!-- Recommendation region: external routes (SDKs, automation). Set off
             by a rule + eyebrow so it reads as "these live elsewhere", not more
             of the same grid. -->
        <section
          v-if="recommendationCards.length > 0"
          class="border-t border-border/60 pt-8"
        >
          <div class="mb-4">
            <h2 class="text-sm font-medium text-foreground">
              {{ t("connections.explore.sections.build.title") }}
            </h2>
            <p class="mt-0.5 text-xs text-muted-foreground">
              {{ t("connections.explore.sections.build.description") }}
            </p>
          </div>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <ProviderCard
              v-for="card in recommendationCards"
              :key="card.id"
              :provider="card"
              @connect="connect"
            />
          </div>
        </section>
      </template>

      <!-- Connect dialog (storage) -->
      <ConnectConnectionDialog
        v-model:open="storageOpen"
        :provider="storageProvider"
        :provider-name="seed.name"
        :provider-icon="seed.icon"
        :is-loading="isCreating"
        @connect="submitCredentials"
      />

      <!-- Connect dialog (LLM) -->
      <ConnectLlmDialog
        v-model:open="llmOpen"
        :provider="llmProvider"
        :is-loading="isCreating"
        @connect="submitCredentials"
      />

      <!-- Connect dialog (cloud file service / OAuth) -->
      <ConnectFileServiceDialog
        v-model:open="fileServiceOpen"
        :provider="fileServiceProvider"
        :provider-name="seed.name"
        :provider-icon="seed.icon"
        :is-loading="isStartingOAuth"
        @connect="submitOAuth"
      />
    </div>
  </div>
</template>
