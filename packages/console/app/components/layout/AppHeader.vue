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
} from "#console/components/ui/breadcrumb";
import {
	FeedbackModal,
	NotificationsDropdown,
} from "#console/components/layout/header";

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

// Modal states
const isFeedbackModalOpen = ref(false);

function openFeedbackModal() {
	isFeedbackModalOpen.value = true;
}
</script>

<template>
  <!-- One flex row of three in-flow zones: the persistent sidebar trigger
       (left) and app chrome (right) reserve their own space, and the swappable
       page content (breadcrumb / tabs / page controls) takes the middle. Because
       every zone is in normal flow, the middle shrinks to fit between the others
       and can never overlap the chrome at any width or sidebar state. -->
  <header
    class="sticky top-0 z-10 flex h-11 shrink-0 items-center gap-2 border-b border-border/50 bg-background/80 px-3 backdrop-blur-sm rounded-t-xl"
  >
    <!-- Left: sidebar trigger. -->
    <div class="flex shrink-0 items-center gap-2">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="h-4 bg-border/50" />
    </div>

    <!-- Middle: page content. `min-w-0` lets it shrink/truncate instead of
         pushing the chrome off-screen. A page shows EITHER the breadcrumb
         category OR its own header row (tabs/controls) teleported into the
         socket — pages with a socket header set `hideCategory`. -->
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <Breadcrumb v-if="pageCategory" class="shrink-0">
        <BreadcrumbList class="flex items-center">
          <BreadcrumbItem class="flex items-center">
            <BreadcrumbPage
              class="text-sm font-medium text-muted-foreground leading-none"
            >
              {{ pageCategory }}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <!-- The socket: a page teleports its own header row here via HeaderSocket.
           `display: contents` so an empty socket takes no space; the teleported
           child carries its own `flex-1`. -->
      <div id="header-socket" class="contents" />
    </div>

    <!-- Right: persistent app chrome. -->
    <div class="flex shrink-0 items-center gap-2">
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
