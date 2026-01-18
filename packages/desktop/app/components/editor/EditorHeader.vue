<template>
  <div
    data-tauri-drag-region
    class="h-12 flex-shrink-0 flex items-center justify-between pl-20 pr-3 border-b border-border/30 bg-background/80 backdrop-blur-sm"
  >
    <!-- Left: Sidebar trigger + tabs -->
    <div data-tauri-drag-region class="flex items-center gap-2">
      <button
        @click="$emit('toggle-sidebar')"
        class="p-1.5 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50 relative z-10"
        :title="sidebarCollapsed ? $t('workspace.showSidebar') : $t('workspace.hideSidebar')"
      >
        <PanelLeft v-if="sidebarCollapsed" class="w-4 h-4" />
        <PanelLeftClose v-else class="w-4 h-4" />
      </button>

      <!-- Document tabs -->
      <div data-tauri-drag-region class="flex items-center gap-1">
        <button
          v-for="tab in openTabs"
          :key="tab.id"
          @click="$emit('select-tab', tab.id)"
          class="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors group"
          :class="activeTabId === tab.id
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'"
        >
          <FileText class="w-3 h-3" />
          <span class="max-w-[100px] truncate">{{ tab.name }}</span>
          <button
            v-if="openTabs.length > 1"
            @click.stop="$emit('close-tab', tab.id)"
            class="w-3.5 h-3.5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-all"
          >
            <X class="w-2.5 h-2.5" />
          </button>
        </button>
      </div>
    </div>

    <!-- Center: Spacer for dragging -->
    <div data-tauri-drag-region class="flex-1 h-full cursor-grab active:cursor-grabbing" />

    <!-- Right: Mode toggle + Always on top -->
    <div class="flex items-center gap-2">
      <!-- Chat/Edit mode toggle -->
      <div class="flex items-center gap-1 bg-muted/50 p-0.5 rounded-md">
        <button
          @click="$emit('update:viewMode', 'chat')"
          class="flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors"
          :class="viewMode === 'chat'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'"
        >
          <MessageCircle class="w-3 h-3" />
          <span>{{ $t('chat.mode.chat') }}</span>
        </button>
        <button
          @click="$emit('update:viewMode', 'edit')"
          class="flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors"
          :class="viewMode === 'edit'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'"
        >
          <List class="w-3 h-3" />
          <span>{{ $t('chat.mode.edit') }}</span>
        </button>
      </div>

      <!-- Always on top toggle -->
      <button
        @click="$emit('toggle-always-on-top')"
        class="p-1.5 rounded-md transition-colors"
        :class="alwaysOnTop
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'"
        :title="$t('workspace.alwaysOnTop')"
      >
        <Pin class="w-4 h-4" :class="alwaysOnTop ? 'fill-current' : ''" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Tab {
	id: string;
	name: string;
	path: string;
}

defineProps<{
	openTabs: Tab[];
	activeTabId: string | null;
	viewMode: "chat" | "edit";
	alwaysOnTop: boolean;
	sidebarCollapsed: boolean;
}>();

defineEmits<{
	"select-tab": [id: string];
	"close-tab": [id: string];
	"update:viewMode": [mode: "chat" | "edit"];
	"toggle-always-on-top": [];
	"toggle-sidebar": [];
}>();
</script>
