<script setup lang="ts">
import type { DetectionTimeSeries } from "@nvisy/sdk/datatypes";

/**
 * GitHub-style heatmap of daily pipeline-detection volume over the last ~year.
 * Each cell is one day, colored by detection count against a stepped intensity
 * ramp; the ramp is a single accent hue (not the status/2FA greens), so it reads
 * as "volume" without colliding with semantic color.
 */
const props = defineProps<{
	timeSeries: DetectionTimeSeries | undefined;
	isLoading: boolean;
}>();

const { t, locale } = useI18n();

const WEEKS = 53;
const DAYS = WEEKS * 7;

// date (YYYY-MM-DD) -> detection count, from the server points.
const countByDate = computed(() => {
	const map = new Map<string, number>();
	for (const p of props.timeSeries?.points ?? []) map.set(p.date, p.detections);
	return map;
});

const totalDetections = computed(() =>
	(props.timeSeries?.points ?? []).reduce((sum, p) => sum + p.detections, 0),
);

// Level thresholds derived from the busiest day, so the ramp adapts to the
// workspace's own scale (a quiet workspace still shows contrast).
const maxCount = computed(() =>
	Math.max(0, ...(props.timeSeries?.points ?? []).map((p) => p.detections)),
);
function levelFor(count: number): 0 | 1 | 2 | 3 | 4 {
	if (count <= 0) return 0;
	const max = maxCount.value || 1;
	const ratio = count / max;
	if (ratio > 0.75) return 4;
	if (ratio > 0.5) return 3;
	if (ratio > 0.25) return 2;
	return 1;
}

// A date-only `YYYY-MM-DD` key from a Date's LOCAL parts (not `toISOString`,
// which is UTC and would shift the day for viewers east/west of UTC, making
// keys disagree with the server's date strings).
const isoDate = (d: Date) => {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
};

// Parse a `YYYY-MM-DD` key back into a local Date (its own components), so
// month labels don't drift across the UTC boundary.
const parseIsoDate = (iso: string) => {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(y!, m! - 1, d!);
};

// The grid window: the last DAYS days, aligned so each column is a Sun–Sat week.
// Columns are weeks (oldest -> newest); rows are weekday (Sun at top).
interface Cell {
	date: string;
	count: number;
	level: 0 | 1 | 2 | 3 | 4;
	label: string;
}

const weeks = computed<Cell[][]>(() => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	// Start DAYS-1 back, then walk backward to the preceding Sunday so week
	// columns line up.
	const start = new Date(today);
	start.setDate(start.getDate() - (DAYS - 1));
	start.setDate(start.getDate() - start.getDay());

	const cols: Cell[][] = [];
	const cursor = new Date(start);
	while (cursor <= today) {
		const col: Cell[] = [];
		for (let d = 0; d < 7; d++) {
			if (cursor > today) break;
			// Snapshot the day before advancing the shared cursor, so the label
			// can't drift if the statements are ever reordered.
			const day = new Date(cursor);
			const date = isoDate(day);
			const count = countByDate.value.get(date) ?? 0;
			col.push({
				date,
				count,
				level: levelFor(count),
				label: t("analytics.activity.cell", {
					count,
					date: dateFormatter.value.format(day),
				}),
			});
			cursor.setDate(cursor.getDate() + 1);
		}
		cols.push(col);
	}
	return cols;
});

const dateFormatter = computed(
	() =>
		new Intl.DateTimeFormat(locale.value, {
			year: "numeric",
			month: "short",
			day: "numeric",
		}),
);

// Month labels: the short month name at each column where a new month begins.
const monthLabels = computed(() => {
	const monthFmt = new Intl.DateTimeFormat(locale.value, { month: "short" });
	const labels: { col: number; name: string }[] = [];
	let prevMonth = -1;
	weeks.value.forEach((col, i) => {
		const first = col[0];
		if (!first) return;
		const firstDate = parseIsoDate(first.date);
		const month = firstDate.getMonth();
		if (month !== prevMonth) {
			labels.push({ col: i, name: monthFmt.format(firstDate) });
			prevMonth = month;
		}
	});
	return labels;
});

// Weekday row labels (localized), showing Mon/Wed/Fri like GitHub.
const weekdayLabels = computed(() => {
	const fmt = new Intl.DateTimeFormat(locale.value, { weekday: "short" });
	// A known Sunday, to derive localized short weekday names by offset.
	const sunday = new Date(2024, 0, 7);
	return [0, 1, 2, 3, 4, 5, 6].map((offset, i) => {
		const d = new Date(sunday);
		d.setDate(d.getDate() + offset);
		// Only label rows 1/3/5 (Mon/Wed/Fri), matching GitHub's sparse labels.
		return i % 2 === 1 ? fmt.format(d) : "";
	});
});
</script>

<template>
  <div class="rounded-xl border border-border/50 bg-card p-5">
    <div class="mb-4 flex items-baseline justify-between gap-3">
      <span
        class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {{ t("analytics.activity.title") }}
      </span>
      <span class="text-sm text-muted-foreground">
        <b class="font-semibold tabular-nums text-foreground">{{
          totalDetections.toLocaleString()
        }}</b>
        {{ t("analytics.activity.totalSuffix") }}
      </span>
    </div>

    <div v-if="isLoading && !timeSeries" class="flex h-[132px] items-center justify-center">
      <div class="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
    </div>

    <div v-else class="overflow-x-auto">
      <div class="inline-flex gap-2">
        <!-- Weekday labels -->
        <div class="grid shrink-0 grid-rows-7 gap-[3px] pt-[18px] text-[9px] text-muted-foreground">
          <span
            v-for="(day, i) in weekdayLabels"
            :key="i"
            class="flex h-3 items-center"
          >
            {{ day }}
          </span>
        </div>

        <div>
          <!-- Month labels -->
          <div class="relative mb-1 h-3 text-[10px] text-muted-foreground">
            <span
              v-for="m in monthLabels"
              :key="m.col"
              class="absolute"
              :style="{ left: `${m.col * 15}px` }"
            >
              {{ m.name }}
            </span>
          </div>

          <!-- Cells: columns = weeks, rows = weekday -->
          <div class="flex gap-[3px]">
            <div
              v-for="(col, ci) in weeks"
              :key="ci"
              class="grid grid-rows-7 gap-[3px]"
            >
              <div
                v-for="cell in col"
                :key="cell.date"
                class="size-3 rounded-[2px]"
                :class="`activity-lvl-${cell.level}`"
                :title="cell.label"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div
        class="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground"
      >
        <span>{{ t("analytics.activity.less") }}</span>
        <span
          v-for="lvl in [0, 1, 2, 3, 4]"
          :key="lvl"
          class="size-3 rounded-[2px]"
          :class="`activity-lvl-${lvl}`"
        />
        <span>{{ t("analytics.activity.more") }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Run-volume intensity ramp — a single accent hue, stepped, defined against the
   theme tokens so it works in light and dark. */
.activity-lvl-0 {
	background: var(--activity-lvl-0);
}
.activity-lvl-1 {
	background: var(--activity-lvl-1);
}
.activity-lvl-2 {
	background: var(--activity-lvl-2);
}
.activity-lvl-3 {
	background: var(--activity-lvl-3);
}
.activity-lvl-4 {
	background: var(--activity-lvl-4);
}
</style>
