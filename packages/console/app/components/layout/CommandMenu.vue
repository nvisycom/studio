<script setup lang="ts">
import { CornerDownLeft } from "@lucide/vue";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "#console/components/ui/command";
import { Dialog, DialogContent } from "#console/components/ui/dialog";
import { Kbd } from "#console/components/ui/kbd";

/**
 * The ⌘K command palette. A thin renderer over `useCommandMenu`, which owns the
 * command registry (nav links from `useNavigation` + actions), the open state,
 * and the derived global shortcuts. No local config or emits live here.
 */
const { t } = useI18n();
const { getKbdKey } = useKbd();
const { isOpen, toggle, sections, shortcutConfig } = useCommandMenu();

// ⌘K toggles the palette itself (always active). The per-entry ⌘/Ctrl + <key>
// shortcuts are derived from the same entries the palette renders (and disable
// themselves while it's open). Both must be registered in a component's setup.
defineShortcuts({ meta_k: () => toggle() });
defineShortcuts(shortcutConfig);
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-[620px] gap-0 overflow-hidden p-0">
      <Command class="border-0 shadow-none">
        <CommandInput :placeholder="t('commandMenu.placeholder')" />
        <CommandList class="max-h-[min(420px,60vh)] p-1.5">
          <CommandEmpty class="px-4 py-10">
            <p class="text-sm text-foreground">
              {{ t("commandMenu.noResults") }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ t("commandMenu.noResultsHint") }}
            </p>
          </CommandEmpty>

          <!-- Quiet uppercase group headings do the visual separating, so no hard
               rules between groups. -->
          <CommandGroup
            v-for="section in sections"
            :key="section.id"
            :heading="section.label"
          >
            <CommandItem
              v-for="entry in section.entries"
              :key="entry.id"
              :value="entry.label.toLowerCase()"
              class="cursor-pointer"
              :class="entry.danger && 'text-destructive'"
              @select="entry.run()"
            >
              <component :is="entry.icon" class="size-4" />
              <span>{{ entry.label }}</span>
              <div v-if="entry.shortcut" class="ml-auto flex items-center gap-1">
                <Kbd>{{ getKbdKey("meta") }}</Kbd>
                <Kbd>{{ entry.shortcut }}</Kbd>
              </div>
            </CommandItem>
          </CommandGroup>
        </CommandList>

        <!-- Footer: keyboard hints, so the palette reads as keyboard-first. -->
        <div
          class="flex items-center gap-4 border-t px-3 py-2 text-xs text-muted-foreground"
        >
          <span class="flex items-center gap-1.5">
            <Kbd>↑</Kbd><Kbd>↓</Kbd>
            {{ t("commandMenu.footer.navigate") }}
          </span>
          <span class="flex items-center gap-1.5">
            <Kbd><CornerDownLeft :size="12" /></Kbd>
            {{ t("commandMenu.footer.select") }}
          </span>
          <span class="ml-auto flex items-center gap-1.5">
            <Kbd>esc</Kbd>
            {{ t("commandMenu.footer.close") }}
          </span>
        </div>
      </Command>
    </DialogContent>
  </Dialog>
</template>
