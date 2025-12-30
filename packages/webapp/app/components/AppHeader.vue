<script setup lang="ts">
import { ref, computed } from "vue";
import { MessageSquare } from "lucide-vue-next";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  HeaderTabs,
  FeedbackModal,
  NotificationsDropdown,
} from "@/components/header";

const route = useRoute();

// Get page category from route meta
const pageCategory = computed(
  () => route.meta.pageCategory as string | undefined,
);

// Modal states
const isFeedbackModalOpen = ref(false);

function openFeedbackModal() {
  isFeedbackModalOpen.value = true;
}
</script>

<template>
  <header
    class="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-neutral-200 dark:border-neutral-800 bg-background"
  >
    <div class="flex items-center gap-2 px-4">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-2 h-4" />
      <h1 v-if="pageCategory" class="text-lg font-medium mr-4">
        {{ pageCategory }}
      </h1>
      <HeaderTabs />
    </div>
    <div class="flex items-center gap-2 px-4">
      <NotificationsDropdown />
      <Button
        variant="ghost"
        size="sm"
        class="flex items-center gap-2"
        @click="openFeedbackModal"
      >
        <MessageSquare :size="16" />
        <span class="hidden sm:inline">Feedback</span>
      </Button>
    </div>

    <!-- Modals -->
    <FeedbackModal v-model:open="isFeedbackModalOpen" />
  </header>
</template>
