<script setup lang="ts">
import { ref } from "vue";
import { Eye, EyeOff } from "@lucide/vue";
import { Input } from "#console/components/ui/input";

/**
 * A password input with a show/hide toggle. Replaces the hand-rolled
 * Input + absolutely-positioned eye button that was duplicated per field.
 */
defineProps<{
	placeholder?: string;
}>();

const { t } = useI18n();
const model = defineModel<string>({ required: true });
const visible = ref(false);
</script>

<template>
  <div class="relative max-w-md">
    <Input
      v-model="model"
      :type="visible ? 'text' : 'password'"
      :placeholder="placeholder"
      class="h-9 pr-10"
    />
    <button
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
      :aria-label="visible ? t('common.hidePassword') : t('common.showPassword')"
      @click="visible = !visible"
    >
      <EyeOff v-if="visible" :size="16" />
      <Eye v-else :size="16" />
    </button>
  </div>
</template>
