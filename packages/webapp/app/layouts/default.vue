<script setup lang="ts">
import AppSidebar from "@/components/sidebar/AppSidebar.vue";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />
      <div class="flex flex-1 flex-col">
        <slot />
      </div>
      <AppFooter />
    </SidebarInset>
  </SidebarProvider>
</template>
