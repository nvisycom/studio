<script setup lang="ts">
import { Label } from "#console/components/ui/label";
import { Input } from "#console/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import {
	RETENTION_MODES,
	RETENTION_TARGETS,
	type RetentionForm,
} from "#console/utils/retention";

/**
 * The per-scope retention rows (audit logs / original / redacted documents),
 * shared by the create-workspace sheet and the workspace-settings Data page.
 * Owns only the rows; each parent supplies its own surrounding layout (a
 * collapsible or a card).
 */
const { t } = useI18n();

const retention = defineModel<RetentionForm>("retention", { required: true });
</script>

<template>
  <div class="space-y-2.5">
    <div
      v-for="target in RETENTION_TARGETS"
      :key="target"
      class="flex items-center justify-between gap-3"
    >
      <Label>
        {{ t(`settings.workspace.options.retention.targets.${target}`) }}
      </Label>
      <div class="flex items-center gap-2">
        <Input
          v-if="retention[target].mode === 'days'"
          v-model.number="retention[target].days"
          type="number"
          min="1"
          class="h-9 w-20"
        />
        <Select v-model="retention[target].mode">
          <SelectTrigger class="h-9 w-[200px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="m in RETENTION_MODES" :key="m" :value="m">
              {{ t(`settings.workspace.options.retention.modes.${m}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>
