<script setup lang="ts">
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";

/** One row of a breakdown: a label, its formatted value, and its share (0–1). */
export interface BreakdownRow {
	key: string;
	label: string;
	/** Preformatted display value, e.g. "1,284" or "3.2 GB". */
	value: string;
	/** Optional secondary detail under the label, e.g. "210 files" or in/out split. */
	sub?: string;
	/** Share of the whole, 0–1, driving the proportion bar. */
	fraction: number;
}

defineProps<{
	title: string;
	rows: BreakdownRow[];
	/** Shown when there are no rows (e.g. no runs yet). */
	emptyText: string;
}>();
</script>

<template>
  <Card class="rounded-xl border-border/50 py-0 pt-6">
    <CardHeader>
      <CardTitle
        class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {{ title }}
      </CardTitle>
    </CardHeader>
    <CardContent class="pb-6">
      <div v-if="rows.length" class="flex flex-col gap-3">
        <div v-for="row in rows" :key="row.key" class="flex flex-col gap-1">
          <div class="flex items-baseline justify-between gap-3">
            <span class="truncate text-sm text-foreground">{{ row.label }}</span>
            <span class="shrink-0 text-sm tabular-nums text-muted-foreground">
              {{ row.value }}
            </span>
          </div>
          <div class="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              class="h-full rounded-full bg-foreground/70"
              :style="{ width: `${Math.max(row.fraction * 100, row.fraction > 0 ? 2 : 0)}%` }"
            />
          </div>
          <p v-if="row.sub" class="text-xs text-muted-foreground">
            {{ row.sub }}
          </p>
        </div>
      </div>
      <p v-else class="py-6 text-center text-sm text-muted-foreground">
        {{ emptyText }}
      </p>
    </CardContent>
  </Card>
</template>
