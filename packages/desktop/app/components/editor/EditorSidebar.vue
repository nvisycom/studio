<template>
  <aside
    class="h-full border-r border-border/30 bg-background flex flex-col transition-all duration-200 ease-linear flex-shrink-0"
    :class="collapsed ? 'w-12' : 'w-56'"
  >
    <!-- Header with search -->
    <div v-if="!collapsed" class="p-2 border-b border-border/30">
      <div class="relative">
        <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          :placeholder="$t('workspace.searchFiles')"
          class="w-full h-7 pl-7 pr-2 text-xs bg-muted/50 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    </div>

    <!-- Collapsed header spacer -->
    <div v-else class="h-10 border-b border-border/30" />

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-2">
      <!-- Section label -->
      <div v-if="!collapsed" class="px-2 py-1.5 text-xs font-medium text-muted-foreground">
        {{ $t('workspace.documents') }}
      </div>

      <!-- Document list -->
      <div class="space-y-0.5">
        <div
          v-for="doc in documents"
          :key="doc.path"
          class="group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors"
          :class="activeTabId === doc.path
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'"
          @click="$emit('open-document', doc)"
        >
          <FileText class="w-4 h-4 flex-shrink-0" />
          <span v-if="!collapsed" class="flex-1 text-sm truncate">{{ doc.name }}</span>
          <button
            v-if="!collapsed"
            @click.stop="$emit('remove-document', doc)"
            class="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted-foreground/20 transition-all"
          >
            <X class="w-3 h-3" />
          </button>
        </div>

        <!-- Add document button -->
        <button
          @click="$emit('add-document')"
          class="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          <Plus class="w-4 h-4 flex-shrink-0" />
          <span v-if="!collapsed" class="text-sm">{{ $t('chat.addDocument') }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
interface Document {
	name: string;
	path: string;
}

defineProps<{
	documents: Document[];
	activeTabId: string | null;
	collapsed: boolean;
}>();

defineEmits<{
	"open-document": [doc: Document];
	"remove-document": [doc: Document];
	"add-document": [];
}>();
</script>
