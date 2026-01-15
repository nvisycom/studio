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
// biome-ignore lint/style/useImportType: HeaderTabs is used at runtime via typeof
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
    class="sticky top-0 z-10 flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/80 backdrop-blur-sm"
  >
    <div class="flex items-center gap-2 px-4">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-2 h-4 bg-border/50" />
      <Breadcrumb v-if="pageCategory">
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
      <HeaderTabs ref="headerTabsRef" />
    </div>
    <div class="flex items-center gap-1 px-4">
      <NotificationsDropdown />
      <Button
        variant="ghost"
        size="sm"
        class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        @click="openFeedbackModal"
      >
        <MessageSquare :size="16" />
        <span class="hidden sm:inline text-sm">Feedback</span>
      </Button>
    </div>

    <!-- Modals -->
    <FeedbackModal v-model:open="isFeedbackModalOpen" />
  </header>
</template>
