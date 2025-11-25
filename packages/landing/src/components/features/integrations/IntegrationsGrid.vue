<template>
  <div class="container mx-auto px-4 py-12 md:py-20" id="integrations">
    <div class="max-w-6xl mx-auto">
      <div class="mb-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <IntegrationCard
            v-for="integration in integrations"
            :key="integration.data.title"
            :icon="integration.data.icon"
            :is-brand="integration.data.isBrand"
            :version="integration.data.version"
            :status="integration.data.status"
            :title="integration.data.title"
            :category="integration.data.category"
            :description="integration.data.description"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IntegrationCard from "./IntegrationCard.vue";
import type { CollectionEntry } from "astro:content";

interface Props {
  integrations: CollectionEntry<"integrations">[];
}

const props = defineProps<Props>();
const { integrations } = props;
</script>
