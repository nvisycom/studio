<script setup lang="ts">
import { ref, computed } from "vue";
import { MessageSquare } from "lucide-vue-next";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  <header
    class="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-neutral-200 dark:border-neutral-800 bg-background"
  >
    <div class="flex items-center gap-2 px-4">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-2 h-4" />
      <Breadcrumb v-if="pageCategory">
        <BreadcrumbList class="flex items-center">
          <BreadcrumbItem class="flex items-center">
            <BreadcrumbPage
              class="text-base font-light text-neutral-500 dark:text-neutral-400 leading-none"
            >
              {{ pageCategory }}
            </BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator v-if="hasVisibleTabs" />
        </BreadcrumbList>
      </Breadcrumb>
      <HeaderTabs ref="headerTabsRef" />
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
