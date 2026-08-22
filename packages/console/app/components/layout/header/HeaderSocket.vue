<script setup lang="ts">
/**
 * Renders its content into the app header's middle zone. A page uses this to own
 * its own header row (tabs, controls, actions) instead of the header hardcoding
 * per-route branches — the content lives in the page, next to the state it uses.
 *
 * `<HeaderSocket>…</HeaderSocket>` teleports into `#header-socket` (rendered by
 * AppHeader). `defer` waits for the target to exist on the client; the socket is
 * client-only chrome, so nothing renders during SSR — which is fine (both apps
 * run SPA). The teleported node fills the zone as a flex row.
 */
</script>

<template>
  <Teleport to="#header-socket" defer>
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <slot />
    </div>
  </Teleport>
</template>
