<script setup lang="ts">
import { Switch } from "#console/components/ui/switch";

/**
 * A switch paired with an "Enabled / Disabled" caption, as used in the create /
 * edit sheet footers (webhooks, pipelines). Labels default to the shared
 * `common.enabled` / `common.disabled` strings but can be overridden.
 */
const { t } = useI18n();

defineProps<{
	enabledLabel?: string;
	disabledLabel?: string;
}>();

const model = defineModel<boolean>({ required: true });
</script>

<template>
  <div class="flex items-center gap-2">
    <Switch v-model="model" />
    <span class="text-sm text-muted-foreground">
      {{
        model
          ? (enabledLabel ?? t("common.enabled"))
          : (disabledLabel ?? t("common.disabled"))
      }}
    </span>
  </div>
</template>
