<script setup lang="ts">
import type { Connection } from "@nvisy/sdk/datatypes";
import { Loader2, HardDrive, Plug, Check, TriangleAlert } from "@lucide/vue";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import { Button } from "#console/components/ui/button";
import { providerIcon, providerLabel } from "#console/utils/connections";

const { t } = useI18n();

const props = withDefaults(
	defineProps<{
		open?: boolean;
		/** Workspace file ids to export (drives the count in the header). */
		fileIds: string[];
		/**
		 * How many of the files being exported are originals, i.e. not redacted.
		 * Sending these to an external service leaks their raw contents, so the
		 * dialog warns before export.
		 */
		unredactedCount?: number;
		/** The workspace's connections; only file services can receive an export. */
		connections: Connection[];
		isLoading?: boolean;
	}>(),
	{ open: false, isLoading: false, unredactedCount: 0 },
);

const emit = defineEmits<{
	(e: "update:open", value: boolean): void;
	(e: "export", connectionId: string): void;
}>();

// Only file-service connections can receive an export; object stores and LLMs
// can't. Inactive connections are excluded - a paused connection won't sync.
const targets = computed(() =>
	props.connections.filter(
		(c) => c.providerType === "file_service" && c.isActive,
	),
);

const selectedId = ref<string | null>(null);

// Default to the first target and clear the selection each time the dialog opens.
watch(
	() => props.open,
	(isOpen) => {
		if (isOpen) selectedId.value = targets.value[0]?.id ?? null;
	},
);

function handleOpenChange(open: boolean) {
	emit("update:open", open);
}

function submit() {
	if (selectedId.value) emit("export", selectedId.value);
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-md gap-0 p-0">
      <DialogHeader class="space-y-1 border-b border-border/60 p-6">
        <DialogTitle class="text-base">
          {{ t("connections.dialogs.export.title") }}
        </DialogTitle>
        <DialogDescription class="text-sm">
          {{ t("connections.dialogs.export.description", { count: fileIds.length }) }}
        </DialogDescription>
      </DialogHeader>

      <div class="max-h-[50vh] overflow-y-auto p-4">
        <!-- No file-service connection to export to. -->
        <div
          v-if="targets.length === 0"
          class="flex flex-col items-center gap-3 py-8 text-center"
        >
          <div
            class="flex size-10 items-center justify-center rounded-lg bg-muted/50"
          >
            <Plug class="size-5 text-muted-foreground" />
          </div>
          <p class="text-sm text-foreground">
            {{ t("connections.dialogs.export.emptyTitle") }}
          </p>
          <p class="max-w-xs text-xs text-muted-foreground">
            {{ t("connections.dialogs.export.emptyDescription") }}
          </p>
        </div>

        <!-- Pick the destination connection. -->
        <div v-else class="space-y-1">
          <button
            v-for="c in targets"
            :key="c.id"
            type="button"
            :aria-pressed="selectedId === c.id"
            :class="[
              'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              selectedId === c.id
                ? 'border-foreground/30 bg-muted/60'
                : 'border-transparent hover:bg-muted/40',
            ]"
            @click="selectedId = c.id"
          >
            <div
              class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40"
            >
              <img
                v-if="providerIcon(c.provider)"
                :src="providerIcon(c.provider)!"
                :alt="c.provider"
                class="size-5 object-contain"
              />
              <HardDrive v-else :size="18" class="text-muted-foreground" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-foreground">
                {{ c.displayName }}
              </p>
              <p class="truncate text-xs text-muted-foreground">
                {{ providerLabel(c.provider) }}
              </p>
            </div>
            <Check
              v-if="selectedId === c.id"
              :size="16"
              class="shrink-0 text-foreground"
            />
          </button>
        </div>
      </div>

      <!-- Warn when exporting originals: their raw contents leave the workspace
           un-redacted. Only shown when there's somewhere to export to. -->
      <div
        v-if="unredactedCount > 0 && targets.length > 0"
        class="mx-4 mb-2 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3"
      >
        <TriangleAlert
          :size="15"
          class="mt-px shrink-0 text-amber-600 dark:text-amber-500"
        />
        <p class="text-xs text-foreground">
          {{ t("connections.dialogs.export.unredactedWarning", { count: unredactedCount }) }}
        </p>
      </div>

      <DialogFooter class="border-t border-border/60 p-6">
        <Button variant="outline" @click="emit('update:open', false)">
          {{ t("common.cancel") }}
        </Button>
        <Button
          :disabled="!selectedId || isLoading || targets.length === 0"
          @click="submit"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("connections.dialogs.export.submit", { count: fileIds.length }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
