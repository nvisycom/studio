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
 * (not-yet-wired) actions live in one place.
 */
const period = defineModel<string>("period", { required: true });

const { t } = useI18n();
</script>

<template>
  <div class="flex items-center justify-between mb-6">
    <Select v-model="period">
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
      <!-- Import/Export aren't wired to a backend yet; disable them with a
           tooltip rather than present buttons that silently do nothing. -->
      <Button variant="outline" disabled :title="t('common.comingSoon')">
        <Upload :size="16" class="mr-2" />
        {{ t("analytics.common.import") }}
      </Button>
      <Button variant="outline" disabled :title="t('common.comingSoon')">
        <Download :size="16" class="mr-2" />
        {{ t("analytics.common.export") }}
      </Button>
    </div>
  </div>
</template>
