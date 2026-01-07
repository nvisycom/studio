<template>
  <div class="space-y-1.5 animate-in fade-in duration-200">
    <!-- Empty State -->
    <div v-if="services.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
      <Server class="w-10 h-10 text-muted-foreground/50 mb-3" />
      <p class="text-sm text-muted-foreground mb-1">{{ $t('services.empty.title') }}</p>
      <p class="text-xs text-muted-foreground">{{ $t('services.empty.description') }}</p>
    </div>

    <div
      v-for="service in services"
      :key="service.id"
      class="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors bg-muted/30"
    >
      <div class="flex items-center space-x-3">
        <component :is="service.icon" class="w-5 h-5 text-muted-foreground" />
        <div class="flex-1 min-w-0">
          <p class="text-[15px]">{{ service.name }}</p>
          <p class="text-xs text-muted-foreground">{{ service.description }}</p>
        </div>
      </div>
      <div
        class="px-2 py-0.5 rounded text-xs"
        :class="service.running ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'"
      >
        {{ service.running ? $t('services.running') : $t('services.stopped') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Server, Database, HardDrive, Brain, Webhook } from "lucide-vue-next";

// Services data
const services = ref([
  { id: 1, name: "API Server", description: "REST API", icon: Server, running: true },
  { id: 2, name: "Database", description: "PostgreSQL", icon: Database, running: true },
  { id: 3, name: "Object Store", description: "NATS", icon: HardDrive, running: true },
  { id: 4, name: "Inference", description: "OCR, Embeddings, VLM", icon: Brain, running: true },
  { id: 5, name: "Webhooks", description: "Event Notifications", icon: Webhook, running: true },
]);
</script>
