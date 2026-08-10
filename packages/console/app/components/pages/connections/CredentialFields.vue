<script setup lang="ts">
import type { CredentialField } from "#console/utils/connectionProviders";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { Textarea } from "#console/components/ui/textarea";

const { t } = useI18n();

const props = defineProps<{
	fields: CredentialField[];
	/** i18n prefix for field labels; `<prefix>.<labelKey>` is resolved. */
	labelPrefix: string;
	/** i18n key for the "optional" suffix on non-required fields. */
	optionalKey: string;
}>();

/** Credential values keyed by field key, bound via v-model. */
const credentials = defineModel<Record<string, string>>({ required: true });

// Multiline credentials (e.g. a JSON key blob) span the full width; the rest
// flow through a two-column grid.
const gridFields = computed(() => props.fields.filter((f) => !f.multiline));
const fullFields = computed(() => props.fields.filter((f) => f.multiline));

const label = (field: CredentialField) =>
	t(`${props.labelPrefix}.${field.labelKey}`);
</script>

<template>
  <div class="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
    <div v-for="field in gridFields" :key="field.key" class="space-y-1.5">
      <Label class="text-sm font-normal">
        {{ label(field) }}
        <span v-if="!field.required" class="text-muted-foreground">
          · {{ t(optionalKey) }}
        </span>
      </Label>
      <Input
        v-model="credentials[field.key]"
        :type="field.secret ? 'password' : 'text'"
      />
    </div>
  </div>
  <div v-for="field in fullFields" :key="field.key" class="space-y-1.5">
    <Label class="text-sm font-normal">
      {{ label(field) }}
      <span v-if="!field.required" class="text-muted-foreground">
        · {{ t(optionalKey) }}
      </span>
    </Label>
    <Textarea
      v-model="credentials[field.key]"
      rows="4"
      class="font-mono text-xs"
    />
  </div>
</template>
