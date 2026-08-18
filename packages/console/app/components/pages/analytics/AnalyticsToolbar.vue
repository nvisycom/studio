<script setup lang="ts">
import { Download, Upload } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";

/**
 * Shared analytics toolbar: a reporting-period selector plus Import/Export.
 * Used by the overview and AI analytics pages so the period options and the
 * actions live in one place. Everything here is disabled until the analytics
 * backend exists — the charts are placeholder data, so the period selector
 * wouldn't filter anything, and Import/Export have no endpoint yet.
 */
const period = defineModel<string>("period", { required: true });

const { t } = useI18n();
</script>

<template>
  <div class="flex items-center justify-between mb-6">
    <Select v-model="period" disabled>
      <SelectTrigger class="w-[180px] h-9">
        <SelectValue :placeholder="t('analytics.common.selectPeriod')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="24h">{{ t("analytics.common.period24h") }}</SelectItem>
        <SelectItem value="7d">{{ t("analytics.common.period7d") }}</SelectItem>
        <SelectItem value="30d">{{ t("analytics.common.period30d") }}</SelectItem>
        <SelectItem value="90d">{{ t("analytics.common.period90d") }}</SelectItem>
      </SelectContent>
    </Select>

    <div class="flex gap-2">
      <Button variant="outline" disabled>
        <Upload :size="16" class="mr-2" />
        {{ t("analytics.common.import") }}
      </Button>
      <Button variant="outline" disabled>
        <Download :size="16" class="mr-2" />
        {{ t("analytics.common.export") }}
      </Button>
    </div>
  </div>
</template>
