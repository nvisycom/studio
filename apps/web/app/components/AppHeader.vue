<script setup lang="ts">
import { MessageSquare } from "@lucide/vue";
import { Separator } from "#console/components/ui/separator";
import { SidebarTrigger } from "#console/components/ui/sidebar";
import { Button } from "#console/components/ui/button";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "#console/components/ui/breadcrumb";
import {
	HeaderTabs,
	FeedbackModal,
	NotificationsDropdown,
} from "@/components/header";

const route = useRoute();

// The page category (a `header.category.*` i18n key) is set per page via
// definePageMeta and shown as the header breadcrumb. A page can set
// `hideCategory: true` to reclaim the space for its own header content (the
// studio does, for wider file tabs).
const { t } = useI18n();
const pageCategoryKey = computed(() =>
	route.meta.hideCategory
		? undefined
		: (route.meta.pageCategory as string | undefined),
);
const pageCategory = computed(() =>
	pageCategoryKey.value ? t(pageCategoryKey.value) : undefined,
);

// Ref to HeaderTabs component
const headerTabsRef = ref<InstanceType<typeof HeaderTabs> | null>(null);

// Check if header tabs are visible
const hasVisibleTabs = computed(() => {
	return headerTabsRef.value?.hasVisibleTabs ?? false;
});

// Modal states
const isFeedbackModalOpen = ref(false);

function openFeedbackModal() {
	isFeedbackModalOpen.value = true;
}
</script>

<template>
  <!-- Three zones: a fixed sidebar trigger (left) and app chrome (right) that
       persist on every page, with the swappable, centered page content between
       them (breadcrumb / tabs / page controls). -->
  <header
    class="sticky top-0 z-10 relative flex h-11 shrink-0 items-center border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm"
  >
    <!-- Center content spans the full header (same box as the page body). The
         persistent trigger (left) and chrome (right) are overlaid on the outer
         margins. Each header variant sizes itself: centered controls (files)
         re-center a max-w-7xl column to match the body, while a full-width strip
         (studio tabs) pads to clear the overlays. -->
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <Breadcrumb v-if="pageCategory" class="ml-12 shrink-0">
        <BreadcrumbList class="flex items-center">
          <BreadcrumbItem class="flex items-center">
            <BreadcrumbPage
              class="text-sm font-medium text-muted-foreground leading-none"
            >
              {{ pageCategory }}
            </BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator v-if="hasVisibleTabs" />
        </BreadcrumbList>
      </Breadcrumb>
      <HeaderTabs ref="headerTabsRef" class="min-w-0 flex-1" />
    </div>

    <!-- Left: persistent sidebar trigger, overlaid on the left margin. -->
    <div
      class="absolute left-0 top-1/2 flex -translate-y-1/2 items-center gap-2 pl-3"
    >
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="h-4 bg-border/50" />
    </div>

    <!-- Right: persistent app chrome, overlaid on the right margin. -->
    <div
      class="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2 pr-4"
    >
      <NotificationsDropdown />
      <Button
        variant="ghost"
        size="icon-sm"
        class="rounded-full text-muted-foreground hover:text-foreground"
        :aria-label="t('feedback.title')"
        :title="t('feedback.title')"
        @click="openFeedbackModal"
      >
        <MessageSquare :size="16" />
      </Button>
    </div>

    <!-- Modals -->
    <FeedbackModal v-model:open="isFeedbackModalOpen" />
  </header>
</template>
