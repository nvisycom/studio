<script setup lang="ts">
import {
  Layers,
  Undo,
  Redo,
  X,
  Split,
  Edit3,
  FileOutput,
  Merge,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface Layer {
  id: string;
  name: string;
  icon: any;
  page: number;
}

interface Props {
  layers?: Layer[];
}

interface Emits {
  (e: "undo"): void;
  (e: "redo"): void;
  (e: "deleteLayer", layerId: string): void;
  (e: "selectLayer", layerId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  layers: () => [
    { id: "1", name: "Split Operation", icon: Split, page: 1 },
    { id: "2", name: "Edit Annotation", icon: Edit3, page: 2 },
    { id: "3", name: "Extract Data", icon: FileOutput, page: 3 },
    { id: "4", name: "Merge Pages", icon: Merge, page: 4 },
  ],
});

const emit = defineEmits<Emits>();

function undo() {
  emit("undo");
}

function redo() {
  emit("redo");
}

function deleteLayer(layerId: string) {
  emit("deleteLayer", layerId);
}

function selectLayer(layerId: string) {
  emit("selectLayer", layerId);
}
</script>

<template>
  <Card class="flex flex-col max-h-[500px]">
    <CardHeader class="p-2 pb-1.5 pl-3 pr-2 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Layers :size="16" />
          <h3 class="font-medium text-sm">Layers</h3>
        </div>
        <div class="flex items-center gap-1">
          <Button variant="outline" size="sm" class="h-7 w-7 p-0" @click="undo">
            <Undo :size="14" />
          </Button>
          <Button variant="outline" size="sm" class="h-7 w-7 p-0" @click="redo">
            <Redo :size="14" />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent class="p-2 pt-1 overflow-y-auto flex-1">
      <div class="divide-y divide-neutral-200 dark:divide-neutral-800">
        <div
          v-for="layer in layers"
          :key="layer.id"
          class="py-1.5 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded px-2"
          @click="selectLayer(layer.id)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <component :is="layer.icon" :size="13" />
              <span class="text-sm font-light">{{ layer.name }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Badge variant="secondary" class="text-[10px] px-1.5 py-0">
                Page {{ layer.page }}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                class="h-5 w-5 p-0"
                @click.stop="deleteLayer(layer.id)"
              >
                <X :size="12" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
