<script setup lang="ts">
import AppSidebar from "@/components/sidebar/AppSidebar.vue";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const route = useRoute();

const hideFooter = computed(() => {
  return route.path.startsWith("/studio");
});
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />
      <div class="relative flex flex-1 flex-col min-h-0 overflow-y-auto">
        <slot />
      </div>
      <AppFooter v-if="!hideFooter" />
    </SidebarInset>
  </SidebarProvider>
</template>
