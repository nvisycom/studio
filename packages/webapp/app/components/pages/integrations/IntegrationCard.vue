<script setup lang="ts">
const { t } = useI18n();
import { ExternalLink } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Integration data structure
 */
interface Integration {
  id: number;
  name: string;
  description: string;
  icon: any;
  color: string;
  status: "available" | "coming-soon";
  category: string;
  tags: string[];
  isExternal?: boolean;
  externalUrl?: string;
}

/**
 * Component props interface
 */
interface Props {
  integration: Integration;
}

/**
 * Component emits interface
 */
interface Emits {
  (e: "connect", id: number): void;
  (e: "notifyMe", id: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
  <Card
    class="overflow-hidden border-neutral-200 dark:border-neutral-800 flex flex-col"
  >
    <CardHeader>
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div
            :class="[
              'w-12 h-12 rounded-lg flex items-center justify-center',
              integration.color,
            ]"
          >
            <component :is="integration.icon" :size="24" class="text-white" />
          </div>
          <div>
            <CardTitle class="text-lg">{{ integration.name }}</CardTitle>
            <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              {{ integration.category }}
            </p>
          </div>
        </div>
        <Badge
          v-if="integration.status === 'coming-soon'"
          variant="outline"
          class="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
        >
          {{ t("integrations.status.comingSoon") }}
        </Badge>
      </div>
    </CardHeader>
    <CardContent class="flex-1">
      <CardDescription>
        {{ integration.description }}
      </CardDescription>
    </CardContent>
    <CardFooter class="pt-4">
      <!-- External integration button -->
      <Button
        v-if="integration.status === 'available' && integration.isExternal"
        as-child
        class="w-full"
      >
        <a
          :href="integration.externalUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-2"
        >
          {{ t("integrations.actions.visitWebsite") }}
          <ExternalLink :size="16" />
        </a>
      </Button>
      <!-- Internal integration button -->
      <Button
        v-else-if="integration.status === 'available'"
        @click="emit('connect', integration.id)"
        variant="outline"
        class="w-full"
      >
        {{ t("integrations.actions.connect") }}
      </Button>
      <!-- Coming soon button -->
      <Button
        v-else
        variant="outline"
        @click="emit('notifyMe', integration.id)"
        class="w-full"
      >
        {{ t("integrations.actions.notifyMe") }}
      </Button>
    </CardFooter>
  </Card>
</template>
