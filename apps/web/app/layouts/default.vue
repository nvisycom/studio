<script setup lang="ts">
import AppSidebar from "@/components/sidebar/AppSidebar.vue";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import { SidebarInset, SidebarProvider } from "#console/components/ui/sidebar";

const route = useRoute();
const { workspaces, currentWorkspaceSlug, lastWorkspaceSlug } = useWorkspaces();

// Guard the workspace slug in the URL. Once the workspace list has loaded, if
// the /w/[workspace] slug isn't one the user belongs to, redirect into a valid
// workspace (last-used, else the first). Done in the layout because the list is
// async and can't be validated synchronously in route middleware.
watch(
	[workspaces, currentWorkspaceSlug],
	([list, slug]) => {
		if (!list || !slug) return;
		if (list.some((w) => w.slug === slug)) return;

		const fallback =
			list.find((w) => w.slug === lastWorkspaceSlug.value) ?? list[0];
		navigateTo(fallback ? `/w/${fallback.slug}` : "/", { replace: true });
	},
	{ immediate: true },
);

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
