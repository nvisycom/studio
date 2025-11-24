<script setup lang="ts">
import { Plug2, Webhook } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import IntegrationAnimation from "./IntegrationAnimation.vue";
import WebhookAnimation from "./WebhookAnimation.vue";
import type { FunctionalComponent } from "vue";

interface ConnectCard {
  id: string;
  title: string;
  description: string;
  icon: FunctionalComponent;
  href: string;
  component: any;
}

const cards: ConnectCard[] = [
  {
    id: "integrations",
    title: "Integrations",
    description:
      "Connect with your favorite tools and platforms. Integrate Nvisy seamlessly with cloud storage, collaboration tools, and enterprise software.",
    icon: Plug2,
    href: "/integrations",
    component: IntegrationAnimation,
  },
  {
    id: "webhooks",
    title: "Webhooks",
    description:
      "Build powerful automations with real-time webhooks. Receive instant notifications for document processing events and trigger custom workflows.",
    icon: Webhook,
    href: "https://docs.nvisy.com/webhooks",
    component: WebhookAnimation,
  },
];
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
    <div
      v-for="card in cards"
      :key="card.id"
      class="group relative bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-xl p-8 hover:shadow-2xl hover:border-gray-300 dark:hover:border-neutral-700 transition-all duration-300 overflow-hidden"
    >
      <!-- Content -->
      <div class="relative z-10">
        <!-- Animation Preview -->
        <div class="mb-6">
          <component :is="card.component" />
        </div>

        <!-- Icon (smaller, no background) -->
        <div class="mb-4">
          <component
            :is="card.icon"
            class="w-6 h-6 text-gray-900 dark:text-white"
          />
        </div>

        <!-- Title -->
        <h3 class="text-2xl font-light text-gray-900 dark:text-white mb-3">
          {{ card.title }}
        </h3>

        <!-- Description -->
        <p
          class="text-base font-light text-gray-600 dark:text-neutral-400 leading-relaxed mb-6"
        >
          {{ card.description }}
        </p>

        <!-- Learn More Button -->
        <Button variant="ghost" size="sm" as-child class="font-light">
          <a :href="card.href" class="inline-flex items-center gap-2">
            Learn More
            <svg
              class="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </Button>
      </div>
    </div>
  </div>
</template>
