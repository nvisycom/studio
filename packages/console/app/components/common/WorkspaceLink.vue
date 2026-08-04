<script setup lang="ts">
/**
 * Workspace-scoped `NuxtLink`. Prefixes `to` with the active workspace slug so
 * templates write `<WorkspaceLink to="/files">` instead of interpolating
 * `/w/{slug}/...`. All other attributes (class, target, ...) pass through to the
 * underlying `NuxtLink`.
 *
 * Use plain `NuxtLink` for non-workspace routes (`/auth/*`, `/account/*`).
 */
const props = defineProps<{ to: string }>();

const { wLink } = useWorkspaceLink();
const resolved = computed(() => wLink(props.to));
</script>

<template>
  <NuxtLink :to="resolved">
    <slot />
  </NuxtLink>
</template>
