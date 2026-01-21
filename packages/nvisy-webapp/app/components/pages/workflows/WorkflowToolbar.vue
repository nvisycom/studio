<script setup lang="ts">
import { Play, Save, Undo, Redo, Maximize } from "lucide-vue-next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

interface Props {
  canUndo?: boolean;
  canRedo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canUndo: false,
  canRedo: false,
});

const emit = defineEmits<{
  "fit-view": [];
  run: [];
  save: [];
  undo: [];
  redo: [];
}>();

const { getKbdKey } = useKbd();
</script>

<template>
  <div
    class="absolute top-4 left-4 z-10 flex items-center gap-2 bg-card border border-border rounded-lg p-1 shadow-sm"
  >
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            class="p-2 hover:bg-accent rounded-md transition-colors"
            @click="emit('run')"
          >
            <Play class="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Run Workflow</p>
        </TooltipContent>
      </Tooltip>

      <div class="w-px h-6 bg-border" />

      <Tooltip>
        <TooltipTrigger as-child>
          <button
            class="p-2 hover:bg-accent rounded-md transition-colors"
            @click="emit('save')"
          >
            <Save class="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent class="flex items-center gap-2">
          <span>Save</span>
          <KbdGroup>
            <Kbd>{{ getKbdKey("meta") }}</Kbd>
            <Kbd>S</Kbd>
          </KbdGroup>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <button
            class="p-2 rounded-md transition-colors"
            :class="
              props.canUndo
                ? 'hover:bg-accent'
                : 'opacity-40 cursor-not-allowed'
            "
            :disabled="!props.canUndo"
            @click="props.canUndo && emit('undo')"
          >
            <Undo class="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent class="flex items-center gap-2">
          <span>Undo</span>
          <KbdGroup>
            <Kbd>{{ getKbdKey("meta") }}</Kbd>
            <Kbd>Z</Kbd>
          </KbdGroup>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <button
            class="p-2 rounded-md transition-colors"
            :class="
              props.canRedo
                ? 'hover:bg-accent'
                : 'opacity-40 cursor-not-allowed'
            "
            :disabled="!props.canRedo"
            @click="props.canRedo && emit('redo')"
          >
            <Redo class="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent class="flex items-center gap-2">
          <span>Redo</span>
          <KbdGroup>
            <Kbd>{{ getKbdKey("meta") }}</Kbd>
            <Kbd>Y</Kbd>
          </KbdGroup>
        </TooltipContent>
      </Tooltip>

      <div class="w-px h-6 bg-border" />

      <Tooltip>
        <TooltipTrigger as-child>
          <button
            class="p-2 hover:bg-accent rounded-md transition-colors"
            @click="emit('fit-view')"
          >
            <Maximize class="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Fit View</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>
