<script setup lang="ts">
import { Upload, Loader2, Trash2 } from "@lucide/vue";
import { Label } from "#console/components/ui/label";
import { Button } from "#console/components/ui/button";
import { Card, CardContent, CardFooter } from "#console/components/ui/card";
import EntityAvatar from "#console/components/common/EntityAvatar.vue";

defineProps<{
	/** Name the avatar derives its initials/gradient from. */
	name: string;
	/** Resolved image URL, or undefined to show the gradient fallback. */
	src?: string;
	label: string;
	description: string;
	footer: string;
	/** Accessible label for the remove button. */
	removeLabel: string;
	isUploading?: boolean;
	isDeleting?: boolean;
}>();

const emit = defineEmits<{
	/** Open the file picker (upload). */
	pick: [];
	/** Remove the current avatar. */
	remove: [];
}>();
</script>

<template>
  <Card class="rounded-xl border-border/50 py-0 pt-6">
    <CardContent>
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <Label class="text-sm font-medium">{{ label }}</Label>
          <p class="text-sm text-muted-foreground">{{ description }}</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Remove: trash icon left of the avatar -->
          <Button
            v-if="src"
            variant="ghost"
            size="icon"
            class="size-8 rounded-full text-muted-foreground hover:text-destructive"
            :aria-label="removeLabel"
            :disabled="isDeleting || isUploading"
            @click="emit('remove')"
          >
            <Loader2 v-if="isDeleting" :size="15" class="animate-spin" />
            <Trash2 v-else :size="15" />
          </Button>
          <button
            type="button"
            :disabled="isUploading || isDeleting"
            class="group relative flex size-12 cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-60"
            @click="emit('pick')"
          >
            <EntityAvatar :name="name" :src="src" size="lg" />
            <div
              class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity"
              :class="
                isUploading
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100'
              "
            >
              <Loader2
                v-if="isUploading"
                :size="18"
                class="animate-spin text-white"
              />
              <Upload v-else :size="18" class="text-white" />
            </div>
          </button>
        </div>
      </div>
    </CardContent>
    <CardFooter class="rounded-b-xl border-t border-border/50 bg-muted/30 pb-6">
      <p class="text-xs text-muted-foreground">{{ footer }}</p>
    </CardFooter>
  </Card>
</template>
