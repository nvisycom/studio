<script setup lang="ts">
import type { PendingAdd } from "#console/composables/useStudioAudit";
import { LabelSelect } from "#console/components/common";
import { Button } from "#console/components/ui/button";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "#console/components/ui/popover";

/**
 * The "add a missed entity" card: shown below a text selection the reviewer
 * wants to redact. Mirrors {@link EntityDetailPopover} (the detected-entity
 * detail card) so a manual add reads as the same kind of thing — the label
 * picker takes the place of the entity's title, then the same detail rows
 * (confidence, location, detected-by). Anchored to a frozen rect (`reference`)
 * captured when it opened, since picking a label collapses the live selection.
 */
const props = defineProps<{
	/** The captured selection: its byte span + rect to anchor to (text unused). */
	pending: PendingAdd | null;
}>();

// Two-way: the chosen label id (the entity's identity). The parent owns confirm.
const label = defineModel<string>("label", { default: "" });

const emit = defineEmits<{ confirm: []; cancel: [] }>();

const { t } = useI18n();

// A virtual anchor element from the frozen selection rect (Popover positions
// against anything exposing getBoundingClientRect).
const anchor = computed(() => {
	const rect = props.pending?.rect;
	return rect ? { getBoundingClientRect: () => rect } : undefined;
});

const location = computed(() =>
	props.pending
		? t("studio.audit.bytes", {
				start: props.pending.byteStart,
				end: props.pending.byteEnd,
			})
		: "",
);

function onOpenChange(next: boolean) {
	if (!next) emit("cancel");
}
</script>

<template>
  <Popover :open="!!pending" @update:open="onOpenChange">
    <PopoverAnchor :reference="anchor" />
    <PopoverContent
      side="bottom"
      align="start"
      :side-offset="6"
      class="w-64 p-0"
      @open-auto-focus.prevent
    >
      <div v-if="pending" class="p-3">
        <!-- Identity: the label picker stands in for the entity's title. -->
        <LabelSelect v-model="label" :placeholder="t('studio.audit.pickLabel')" />

        <!-- Same detail rows as a detected entity. -->
        <dl class="mt-3 space-y-1.5 text-xs">
          <div class="flex justify-between gap-3">
            <dt class="shrink-0 text-muted-foreground">
              {{ t("studio.audit.detail.confidence") }}
            </dt>
            <dd class="font-medium tabular-nums text-foreground">100%</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="shrink-0 text-muted-foreground">
              {{ t("studio.audit.detail.location") }}
            </dt>
            <dd class="truncate font-medium text-foreground">{{ location }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="shrink-0 text-muted-foreground">
              {{ t("studio.audit.detail.source") }}
            </dt>
            <dd class="font-medium text-foreground">
              {{ t("studio.audit.detail.byUser") }}
            </dd>
          </div>
        </dl>

        <div class="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" @click="emit('cancel')">
            {{ t("common.cancel") }}
          </Button>
          <Button size="sm" :disabled="!label" @click="emit('confirm')">
            {{ t("studio.audit.addEntity") }}
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
