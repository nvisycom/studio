<script setup lang="ts">
import { LabelSelect } from "#console/components/common";
import { Button } from "#console/components/ui/button";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "#console/components/ui/popover";

/**
 * The "add a missed entity" card: shown next to a region the reviewer marked to
 * redact — a text selection, or a box drawn on an image. Mirrors
 * {@link EntityDetailPopover} (the detected-entity detail card) so a manual add
 * reads as the same kind of thing: the label picker takes the place of the
 * entity's title, then the same detail rows (confidence, location, detected-by).
 *
 * Modality-agnostic: the caller supplies the anchor `rect` (frozen when the
 * popover opened, since picking a label collapses the live selection) and a
 * `location` descriptor string; the popover doesn't know whether the region is a
 * byte span or a box.
 */
const props = defineProps<{
	/** The frozen viewport rect to anchor to, or null when the popover is closed. */
	rect: DOMRect | null;
	/** A short human descriptor of where the entity sits (a byte range, "Region"…). */
	location: string;
}>();

// Two-way: the chosen label id (the entity's identity). The parent owns confirm.
const label = defineModel<string>("label", { default: "" });

const emit = defineEmits<{ confirm: []; cancel: [] }>();

const { t } = useI18n();

// Anchor that survives the close animation (see useFrozenAnchor): driving open
// straight off `rect` would drop the anchor mid-close and teleport the popover.
const { open, anchor, onClose } = useFrozenAnchor(() => props.rect);

function onOpenChange(next: boolean) {
	if (!next) emit("cancel");
}
</script>

<template>
  <Popover :open="open" @update:open="onOpenChange">
    <PopoverAnchor :reference="anchor" />
    <PopoverContent
      side="bottom"
      align="start"
      :side-offset="6"
      class="w-64 p-0"
      @open-auto-focus.prevent
      @animationend="onClose"
    >
      <div v-if="open" class="p-3">
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
