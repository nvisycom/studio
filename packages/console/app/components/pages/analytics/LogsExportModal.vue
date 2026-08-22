<script setup lang="ts">
import type { DateRange } from "reka-ui";
import type { Ref } from "vue";
import { getLocalTimeZone, today } from "@internationalized/date";
import { Calendar, Download, Loader2 } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Label } from "#console/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#console/components/ui/popover";
import { RangeCalendar } from "#console/components/ui/range-calendar";

/**
 * Export the workspace activity log. Pick an (optional) inclusive date range and
 * a format; the page performs the download via `useActivities().exportActivities`.
 * Leaving the range untouched exports the SDK's default window.
 */
interface Props {
	open: boolean;
	isExporting: boolean;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(
		e: "export",
		options: { format: "csv" | "json"; from?: string; to?: string },
	): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

const format = ref<"csv" | "json">("csv");
const isCalendarOpen = ref(false);

// Default to the last 30 days through today, so the picker opens on a sensible
// range; the user can widen or narrow it. Cast as `DateRange` — reka-ui's range
// type and `@internationalized/date`'s DateValue don't unify structurally.
const end = today(getLocalTimeZone());
const start = end.subtract({ days: 30 });
const dateRange = ref({ start, end }) as Ref<DateRange>;

// Reset to defaults each time the modal opens.
watch(
	() => props.open,
	(open) => {
		if (open) {
			format.value = "csv";
			dateRange.value = { start, end };
		}
	},
);

// `CalendarDate.toString()` is ISO `YYYY-MM-DD`, exactly what the export query
// wants.
const toIso = (d: DateRange["start"]) => d?.toString();

const rangeLabel = computed(() => {
	const { start: s, end: e } = dateRange.value;
	if (!s || !e) return t("analytics.logs.exportDialog.selectDateRange");
	return `${formatLongDate(new Date(s.year, s.month - 1, s.day))} – ${formatLongDate(
		new Date(e.year, e.month - 1, e.day),
	)}`;
});

function runExport() {
	emit("export", {
		format: format.value,
		from: toIso(dateRange.value.start),
		to: toIso(dateRange.value.end),
	});
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t("analytics.logs.exportDialog.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("analytics.logs.exportDialog.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-5 py-4">
        <!-- Date range -->
        <div class="space-y-2">
          <Label class="text-sm font-medium">
            {{ t("analytics.logs.exportDialog.dateRange") }}
          </Label>
          <Popover v-model:open="isCalendarOpen">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                class="h-9 w-full justify-start text-left font-normal"
              >
                <Calendar :size="16" class="mr-2 text-muted-foreground" />
                {{ rangeLabel }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <RangeCalendar v-model="dateRange" />
            </PopoverContent>
          </Popover>
        </div>

        <!-- Format -->
        <div class="space-y-2">
          <Label class="text-sm font-medium">
            {{ t("analytics.logs.exportDialog.format") }}
          </Label>
          <div class="flex gap-2">
            <Button
              type="button"
              :variant="format === 'csv' ? 'default' : 'outline'"
              size="sm"
              class="flex-1"
              @click="format = 'csv'"
            >
              {{ t("analytics.logs.exportDialog.csv") }}
            </Button>
            <Button
              type="button"
              :variant="format === 'json' ? 'default' : 'outline'"
              size="sm"
              class="flex-1"
              @click="format = 'json'"
            >
              {{ t("analytics.logs.exportDialog.json") }}
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="ghost"
          :disabled="isExporting"
          @click="emit('update:open', false)"
        >
          {{ t("common.cancel") }}
        </Button>
        <Button :disabled="isExporting" @click="runExport">
          <Loader2 v-if="isExporting" :size="16" class="animate-spin" />
          <Download v-else :size="16" />
          {{ t("analytics.logs.exportDialog.export") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
