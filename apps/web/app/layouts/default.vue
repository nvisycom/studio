<script setup lang="ts">
import AppSidebar from "@/components/sidebar/AppSidebar.vue";
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import { Loader2 } from "@lucide/vue";
import { SidebarInset, SidebarProvider } from "#console/components/ui/sidebar";

const route = useRoute();
const { workspaces, currentWorkspaceSlug } = useWorkspaces();

// Guard the workspace slug in the URL. Once the list loads, if the
// /w/[workspace] slug isn't one the user belongs to (foreign or stale), send
// them to "/", which re-resolves a valid workspace (or onboarding). Done in the
// layout because membership can only be checked once the async list loads.
const isValidWorkspace = computed(() => {
	const list = workspaces.value;
	const slug = currentWorkspaceSlug.value;
	if (!list || !slug) return true; // not yet known — don't redirect
	return list.some((w) => w.slug === slug);
});

watch(
	isValidWorkspace,
	(valid) => {
		if (!valid) navigateTo("/", { replace: true });
	},
	{ immediate: true },
);

const hideFooter = computed(() => {
	return route.path.startsWith("/studio");
});

// Only mount the page once the workspace slug is known-valid, so pages don't
// fire data queries against a workspace the user can't access (which would
// error) while the guard above redirects.
const showPage = computed(
	() =>
		!currentWorkspaceSlug.value ||
		(!!workspaces.value && isValidWorkspace.value),
);
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />
      <div class="relative flex flex-1 flex-col min-h-0 overflow-y-auto">
        <slot v-if="showPage" />
        <div v-else class="flex flex-1 items-center justify-center">
          <Loader2 :size="24" class="animate-spin text-muted-foreground" />
        </div>
      </div>
      <AppFooter v-if="!hideFooter" />
    </SidebarInset>
  </SidebarProvider>
</template>
