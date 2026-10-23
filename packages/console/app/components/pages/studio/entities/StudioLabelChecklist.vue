<script setup lang="ts">
import { ChevronRight } from "@lucide/vue";
import { Checkbox } from "#console/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#console/components/ui/collapsible";

/**
 * An inline, category-grouped checklist of the built-in label catalogue — the
 * same look as the audit list (a category colour dot, a collapsible group with a
 * count, a checkbox per label), so a reviewer scans the possible entity types
 * fast and ticks what to detect. The model is the list of selected label ids.
 *
 * Unlike the tag-field `LabelPicker`, every label is visible at once (grouped),
 * which is what makes it quick to scan — fitting a "what should I detect?" step.
 */
const { t } = useI18n();

const model = defineModel<string[]>({ default: () => [] });

// The catalogue grouped by category (uncategorized last), plus a name resolver.
const { sections, labelName, isLoading } = useLabelOptions(() => []);

// The category a section belongs to, for the colour dot + header name. The
// option sections key catalogue groups as `cat:<category>` (or `uncategorized`).
function sectionCategory(key: string): string | null {
	return key.startsWith("cat:") ? key.slice(4) : null;
}
function categoryName(category: string | null): string {
	if (!category) return t("studio.audit.uncategorized");
	const key = `studio.audit.categories.${category}`;
	const name = t(key);
	return name === key ? category : name;
}

const selected = (id: string) => model.value.includes(id);
function toggle(id: string, checked: boolean | "indeterminate") {
	model.value =
		checked === true
			? [...model.value, id]
			: model.value.filter((v) => v !== id);
}

// How many of a section's labels are selected, for the header count + the
// group checkbox's tri-state.
function sectionSelectedCount(items: { id: string }[]): number {
	return items.reduce((n, l) => n + (selected(l.id) ? 1 : 0), 0);
}
function sectionState(items: { id: string }[]): boolean | "indeterminate" {
	const n = sectionSelectedCount(items);
	return n === 0 ? false : n === items.length ? true : "indeterminate";
}
function toggleSection(
	items: { id: string }[],
	checked: boolean | "indeterminate",
) {
	const ids = items.map((l) => l.id);
	model.value =
		checked === true
			? [...new Set([...model.value, ...ids])]
			: model.value.filter((v) => !ids.includes(v));
}
</script>

<template>
  <div class="space-y-0.5">
    <p v-if="isLoading" class="px-1 py-2 text-sm text-muted-foreground">
      {{ t("common.labelPicker.loading") }}
    </p>
    <Collapsible
      v-for="section in sections"
      :key="section.key"
      :default-open="true"
      class="group/category"
    >
      <!-- Category header: a bulk checkbox + the collapse trigger with the colour
           dot, name, and a selected/total count. -->
      <div class="flex items-center gap-2 px-1 py-1">
        <Checkbox
          :model-value="sectionState(section.items)"
          :aria-label="categoryName(sectionCategory(section.key))"
          @update:model-value="(v) => toggleSection(section.items, v)"
        />
        <CollapsibleTrigger
          class="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight
            :size="11"
            class="shrink-0 transition-transform duration-200 group-data-[state=open]/category:rotate-90"
          />
          <span
            class="category-dot shrink-0"
            :data-category="sectionCategory(section.key) ?? undefined"
            aria-hidden="true"
          />
          <span class="truncate">
            {{
              sectionCategory(section.key)
                ? categoryName(sectionCategory(section.key))
                : (section.label ?? categoryName(null))
            }}
          </span>
          <span
            class="ml-auto rounded-full bg-foreground/10 px-1.5 text-[10px] font-semibold leading-4 text-foreground/70"
          >
            {{ sectionSelectedCount(section.items) }}/{{ section.items.length }}
          </span>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <label
          v-for="label in section.items"
          :key="label.id"
          class="flex cursor-pointer items-center gap-2 rounded-md py-1 pl-7 pr-1 text-sm transition-colors hover:bg-muted"
        >
          <Checkbox
            :model-value="selected(label.id)"
            @update:model-value="(v) => toggle(label.id, v)"
          />
          <span class="truncate">{{ labelName(label.id) }}</span>
        </label>
      </CollapsibleContent>
    </Collapsible>
  </div>
</template>
