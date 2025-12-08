<script setup lang="ts">
import { ref } from "vue";
import { MessageSquare } from "lucide-vue-next";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
	HeaderBreadcrumbs,
	FeedbackModal,
	NotificationsDropdown,
} from "@/components/header";

// Current project (would come from a store/composable in real app)
const currentProject = ref({
	name: "Production App",
});

// Current user (would come from a store/composable in real app)
const currentUser = ref({
	name: "John Doe",
	username: "johndoe",
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
      <HeaderBreadcrumbs
        :current-project="currentProject"
        :current-user="currentUser"
      />
    </div>
    <div class="flex items-center gap-2 px-4">
      <NotificationsDropdown />
      <Button variant="ghost" size="sm" class="flex items-center gap-2" @click="openFeedbackModal">
        <MessageSquare :size="16" />
        <span class="hidden sm:inline">Feedback</span>
      </Button>
    </div>

    <!-- Modals -->
    <FeedbackModal v-model:open="isFeedbackModalOpen"/>
  </header>
</template>
