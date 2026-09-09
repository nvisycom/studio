<script setup lang="ts">
import type { Connection } from "@nvisy/sdk/datatypes";
import { ChevronRight, HardDrive, Plug } from "@lucide/vue";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import { providerIcon, providerLabel } from "#console/utils/connections";

const { t } = useI18n();

const props = withDefaults(
	defineProps<{
		open?: boolean;
		/** The workspace's connections; only importable file services are listed. */
		connections: Connection[];
	}>(),
	{ open: false },
);

const emit = defineEmits<{
	(e: "update:open", value: boolean): void;
	(e: "import", connection: Connection): void;
}>();

// The Dropbox picker only works where the app key is configured; gate its row.
const dropboxAppKey = useRuntimeConfig().public.dropboxAppKey as string;

// Only active file-service connections with a wired browser picker can be
// imported from. A picker not available for a provider (or unconfigured) is
// excluded rather than shown and failing on click.
const sources = computed(() =>
	props.connections.filter(
		(c) =>
			c.providerType === "file_service" &&
			c.isActive &&
			isImportablePicker(c.provider, { dropboxAppKey }),
	),
);

// Picking a source launches its picker immediately (this click is the user
// gesture the popup needs), so close the dialog and hand the connection up.
function pick(connection: Connection) {
	emit("update:open", false);
	emit("import", connection);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-sm gap-0 p-0">
      <DialogHeader class="space-y-1 p-5">
        <DialogTitle class="text-base">
          {{ t("connections.dialogs.import.title") }}
        </DialogTitle>
        <DialogDescription class="text-sm">
          {{ t("connections.dialogs.import.description") }}
        </DialogDescription>
      </DialogHeader>

      <!-- No importable connection. -->
      <div
        v-if="sources.length === 0"
        class="flex flex-col items-center gap-3 px-5 pb-8 pt-2 text-center"
      >
        <div
          class="flex size-10 items-center justify-center rounded-lg bg-muted/50"
        >
          <Plug class="size-5 text-muted-foreground" />
        </div>
        <p class="text-sm text-foreground">
          {{ t("connections.dialogs.import.emptyTitle") }}
        </p>
        <p class="max-w-xs text-xs text-muted-foreground">
          {{ t("connections.dialogs.import.emptyDescription") }}
        </p>
      </div>

      <!-- Pick the source connection. Selecting one launches its picker. Rows
           read as buttons: a hover fill, a lift on the icon, and a chevron that
           slides in to signal the click opens the provider's picker. -->
      <div
        v-else
        class="max-h-[50vh] space-y-0.5 overflow-y-auto border-t border-border/60 p-2"
      >
        <button
          v-for="c in sources"
          :key="c.id"
          type="button"
          class="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50"
          @click="pick(c)"
        >
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background"
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
          <ChevronRight
            :size="16"
            class="shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
          />
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>
