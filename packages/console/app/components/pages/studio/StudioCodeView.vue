<script setup lang="ts">
import type { Segment } from "#console/composables/useDocumentSegments";
import type { TokenKind } from "#console/utils/preview";

/**
 * The raw / code text view: numbered gutter + syntax-coloured, entity-chipped
 * lines. Presentational — it renders the segment lines the parent computed and
 * bubbles chip clicks up.
 */
defineProps<{
	lines: Segment[][];
	activeEntityId?: string | null;
}>();

defineEmits<{ "focus-entity": [id: string] }>();

// Syntax-token color. A "fuller" code palette via CSS custom properties (see
// <style>) so both light and dark themes stay legible. Entity spans render as
// chips instead, so they never take a kind.
const KIND_CLASS: Record<TokenKind, string> = {
	key: "text-[var(--code-key)]",
	string: "text-[var(--code-string)]",
	number: "text-[var(--code-number)]",
	keyword: "text-[var(--code-keyword)]",
	punctuation: "text-[var(--code-punct)]",
};
</script>

<template>
  <div
    class="code-view overflow-hidden rounded-lg border border-border/50 bg-card font-mono text-xs leading-[1.7] shadow-sm"
  >
    <div v-for="(line, ln) in lines" :key="ln" class="flex hover:bg-muted/30">
      <!-- Line-number gutter -->
      <span
        class="w-12 shrink-0 select-none border-r border-border/50 bg-muted/20 px-3 text-right text-muted-foreground/50 tabular-nums"
        aria-hidden="true"
        >{{ ln + 1 }}</span
      >
      <!-- Code content -->
      <code class="whitespace-pre-wrap break-words px-4 text-foreground"
        ><template v-for="(seg, i) in line" :key="i"><button
            v-if="seg.entity"
            type="button"
            :data-entity="seg.entity.id"
            :data-category="seg.entity.category ?? undefined"
            :title="seg.entity.label"
            class="chip"
            :class="{ 'chip--active': activeEntityId === seg.entity.id }"
            @click="$emit('focus-entity', seg.entity.id)"
          >{{ seg.text }}</button><span
            v-else-if="seg.kind"
            :class="KIND_CLASS[seg.kind]"
          >{{ seg.text }}</span><template v-else>{{ seg.text }}</template></template></code>
    </div>
  </div>
</template>

<style scoped>
/* Code syntax palette — distinct but muted hues, tuned per theme so both
   grounds stay legible. Referenced from KIND_CLASS via text-[var(--code-*)]. */
/* Entity-chip styling (the marker underline) is shared and lives in
   assets/css/entities.css so every preview stays consistent. */
.code-view {
	--code-key: oklch(0.5 0.13 256); /* blue */
	--code-string: oklch(0.5 0.11 152); /* green */
	--code-number: oklch(0.52 0.13 65); /* amber */
	--code-keyword: oklch(0.52 0.16 300); /* purple */
	--code-punct: var(--color-muted-foreground);
}
:global(.dark) .code-view {
	--code-key: oklch(0.8 0.15 248); /* blue */
	--code-string: oklch(0.88 0.17 146); /* green */
	--code-number: oklch(0.87 0.14 74); /* amber */
	--code-keyword: oklch(0.82 0.18 320); /* magenta-purple */
	--code-punct: oklch(0.68 0 0);
}
</style>
