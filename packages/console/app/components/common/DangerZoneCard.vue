<script setup lang="ts">
import { Loader2 } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";

/**
 * A destructive "danger zone" card — an uppercase title, description, body copy,
 * and a footer with a warning line and a destructive action button. Used for
 * leave/delete workspace, delete account, and similar. All accents come from the
 * `destructive` theme token, not raw reds.
 */
defineProps<{
	title: string;
	description?: string;
	content?: string;
	warning: string;
	buttonLabel: string;
	isLoading?: boolean;
}>();

defineEmits<{ action: [] }>();
</script>

<template>
  <Card class="rounded-xl border-destructive/30 py-0 pt-6">
    <CardHeader class="pb-4">
      <CardTitle
        class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {{ title }}
      </CardTitle>
      <CardDescription v-if="description" class="text-sm">
        {{ description }}
      </CardDescription>
    </CardHeader>
    <CardContent v-if="content">
      <p class="text-xs text-muted-foreground">{{ content }}</p>
    </CardContent>
    <CardFooter
      class="flex items-center justify-between rounded-b-xl border-t border-destructive/30 bg-destructive/5 pb-6"
    >
      <p class="text-xs text-destructive">{{ warning }}</p>
      <Button
        size="sm"
        variant="destructive"
        :disabled="isLoading"
        @click="$emit('action')"
      >
        <Loader2 v-if="isLoading" :size="16" class="mr-2 animate-spin" />
        {{ buttonLabel }}
      </Button>
    </CardFooter>
  </Card>
</template>
