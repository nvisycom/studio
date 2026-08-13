<script setup lang="ts">
import type { TextEntityView } from "#console/composables/useTextEntities";
import { byteOffsetToChar, parseCsv } from "#console/utils/preview";

const props = withDefaults(
	defineProps<{
		text: string;
		/** Treat the first row as a header row rather than data. */
		withHeaders?: boolean;
		entities?: TextEntityView[];
		activeEntityId?: string | null;
	}>(),
	{ withHeaders: true, entities: () => [], activeEntityId: null },
);

const emit = defineEmits<{ "focus-entity": [id: string] }>();

const parsed = computed(() => parseCsv(props.text));

// Header labels (when enabled) and the data rows beneath them, each tagged with
// its original CSV row index so entity cell coords still line up.
const headers = computed<string[] | null>(() =>
	props.withHeaders ? (parsed.value.rows[0] ?? []) : null,
);
const dataRows = computed<{ row: number; cells: string[] }[]>(() => {
	const start = props.withHeaders ? 1 : 0;
	return parsed.value.rows.slice(start).map((cells, i) => ({
		row: start + i,
		cells,
	}));
});

// Entities indexed by "row,col" so each cell can find its detections fast.
const byCell = computed(() => {
	const map = new Map<string, TextEntityView[]>();
	for (const e of props.entities) {
		if (!e.cell) continue;
		const key = `${e.cell.row},${e.cell.column}`;
		const list = map.get(key);
		if (list) list.push(e);
		else map.set(key, [e]);
	}
	return map;
});

/** A rendered run within a cell: plain text or a flagged entity chip. */
interface Part {
	text: string;
	entity: TextEntityView | null;
}

/**
 * Split a cell's value into plain + entity runs. Entity offsets are byte ranges
 * *within the cell*; on the common unquoted cell they match the value's chars,
 * so we slice directly and skip any span that doesn't fit (defensive).
 */
function cellParts(row: number, col: number, value: string): Part[] {
	const ents = byCell.value.get(`${row},${col}`);
	if (!ents?.length) return [{ text: value, entity: null }];

	// Entity offsets are UTF-8 byte positions within the cell; convert to char
	// indices before slicing the (UTF-16) value. Unset end means the whole cell.
	const spans = ents
		.map((e) => ({
			e,
			start: byteOffsetToChar(value, e.start),
			end: Number.isFinite(e.end)
				? byteOffsetToChar(value, e.end)
				: value.length,
		}))
		.filter((s) => s.start >= 0 && s.end <= value.length && s.end > s.start)
		.sort((a, b) => a.start - b.start);

	const out: Part[] = [];
	let cursor = 0;
	for (const { e, start, end } of spans) {
		if (start < cursor) continue;
		if (start > cursor)
			out.push({ text: value.slice(cursor, start), entity: null });
		out.push({ text: value.slice(start, end), entity: e });
		cursor = end;
	}
	if (cursor < value.length)
		out.push({ text: value.slice(cursor), entity: null });
	return out;
}
</script>

<template>
  <div class="csv-table overflow-auto rounded-lg border border-border/50 bg-card">
    <table class="border-collapse text-xs">
      <thead v-if="headers">
        <tr>
          <th class="num-col" aria-hidden="true" />
          <th
            v-for="(head, c) in headers"
            :key="c"
            class="whitespace-nowrap border-b border-border/60 bg-muted/40 px-3 py-2 text-left font-semibold text-foreground"
          >
            {{ head }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(line, i) in dataRows"
          :key="line.row"
          class="hover:bg-muted/20"
        >
          <!-- Row-number gutter (data-relative when headers are on) -->
          <td class="num-col select-none text-right text-muted-foreground/50 tabular-nums">
            {{ withHeaders ? i + 1 : line.row + 1 }}
          </td>
          <td
            v-for="c in parsed.columns"
            :key="c - 1"
            class="whitespace-nowrap border-b border-border/40 px-3 py-1.5 align-top font-mono text-foreground"
          >
            <template
              v-for="(part, pi) in cellParts(line.row, c - 1, line.cells[c - 1] ?? '')"
              :key="pi"
            ><button
                v-if="part.entity"
                type="button"
                :data-entity="part.entity.id"
                :title="part.entity.label"
                class="chip"
                :class="{ 'chip--active': activeEntityId === part.entity.id }"
                @click="emit('focus-entity', part.entity.id)"
              >{{ part.text }}</button><template v-else>{{ part.text }}</template></template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.csv-table {
	--flag: oklch(0.68 0.15 65);
}
:global(.dark) .csv-table {
	--flag: oklch(0.82 0.15 75);
}
.num-col {
	width: 3rem;
	padding: 0.375rem 0.75rem;
	border-bottom: 1px solid var(--color-border);
	border-right: 1px solid var(--color-border);
	background-color: color-mix(in oklab, var(--color-muted) 20%, transparent);
}
.chip {
	border-radius: 0.25rem;
	padding: 0 0.25rem;
	margin: 0 -0.25rem;
	background-color: color-mix(in oklab, var(--flag) 15%, transparent);
	color: inherit;
	font: inherit;
	cursor: pointer;
	transition: background-color 0.15s, box-shadow 0.15s;
}
.chip:hover {
	background-color: color-mix(in oklab, var(--flag) 25%, transparent);
}
.chip--active {
	background-color: color-mix(in oklab, var(--flag) 28%, transparent);
	box-shadow: 0 0 0 1.5px var(--flag);
}
</style>
