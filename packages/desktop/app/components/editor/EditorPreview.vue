<template>
  <div class="flex-1 flex flex-col overflow-hidden bg-muted/20">
    <div v-if="activeDocument" class="flex-1 flex flex-col overflow-hidden">
      <!-- Document preview header -->
      <div class="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-background/50">
        <div class="flex items-center gap-2">
          <FileText class="w-4 h-4 text-muted-foreground" />
          <span class="text-sm font-medium">{{ activeDocument.name }}</span>
        </div>
        <div class="flex items-center gap-1">
          <button class="p-1.5 rounded hover:bg-muted transition-colors" :title="$t('workspace.zoomIn')">
            <ZoomIn class="w-4 h-4 text-muted-foreground" />
          </button>
          <button class="p-1.5 rounded hover:bg-muted transition-colors" :title="$t('workspace.zoomOut')">
            <ZoomOut class="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <!-- Document preview content -->
      <div class="flex-1 overflow-auto p-4">
        <div class="bg-background rounded-lg border border-border/50 p-8 min-h-full">
          <p class="text-muted-foreground text-center">
            {{ $t('workspace.previewPlaceholder') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <FileText class="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p class="text-sm text-muted-foreground">{{ $t('workspace.noDocument') }}</p>
        <button
          @click="$emit('add-document')"
          class="mt-3 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {{ $t('chat.addDocument') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Document {
	name: string;
	path: string;
}

defineProps<{
	activeDocument: Document | null;
}>();

defineEmits<{
	"add-document": [];
}>();
</script>
