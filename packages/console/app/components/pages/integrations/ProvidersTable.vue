<script setup lang="ts">
import type { Provider } from "@nvisy/sdk/datatypes";
import type { RowAction } from "#console/components/pages/RowActions.vue";
import type {
	VirtualColumn,
	VirtualTableEmpty,
} from "#console/components/ui/virtual-table";
import { Edit, Trash2, PlugZap, Bot } from "@lucide/vue";
import { Switch } from "#console/components/ui/switch";
import { VirtualTable } from "#console/components/ui/virtual-table";
import { providerIcon, providerLabel } from "#console/utils/connections";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();

defineProps<{
	providers: Provider[];
	empty?: VirtualTableEmpty;
}>();

const emit = defineEmits<{
	(e: "configure", providerId: string): void;
	(e: "delete", providerId: string): void;
	(e: "test", providerId: string): void;
	(e: "toggleActive", provider: Provider): void;
}>();

const columns = computed<VirtualColumn<Provider>[]>(() => [
	{
		key: "name",
		header: t("providers.table.headers.name"),
		cell: () => ({ type: "custom" }),
	},
	{
		key: "enabled",
		header: t("providers.table.headers.enabled"),
		width: "100px",
		cell: () => ({ type: "custom" }),
	},
	{
		key: "type",
		header: t("providers.table.headers.type"),
		width: "120px",
		cell: (p) => ({
			type: "text",
			value: t(`providers.types.${p.providerType}`),
			muted: true,
		}),
	},
	{
		key: "updated",
		header: t("providers.table.headers.updated"),
		width: "160px",
		cell: (p) => ({
			type: "text",
			value: relativeTime(p.updatedAt),
			muted: true,
		}),
	},
]);

function rowActions(provider: Provider): RowAction[] {
	return [
		{
			key: "configure",
			label: t("providers.table.actions.configure"),
			icon: Edit,
			select: () => emit("configure", provider.id),
		},
		{
			key: "test",
			label: t("providers.table.actions.test"),
			icon: PlugZap,
			select: () => emit("test", provider.id),
		},
		{
			key: "delete",
			label: t("providers.table.actions.delete"),
			icon: Trash2,
			danger: true,
			separatorBefore: true,
			select: () => emit("delete", provider.id),
		},
	];
}
</script>

<template>
  <VirtualTable
    :rows="providers"
    :columns="columns"
    :row-actions="rowActions"
    :menu-label="t('providers.table.actions.menu')"
    :empty="empty"
  >
    <!-- Name + provider logo -->
    <template #cell-name="{ row }">
      <div class="flex items-center gap-3">
        <div
          class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40"
        >
          <img
            v-if="providerIcon(row.provider)"
            :src="providerIcon(row.provider)!"
            :alt="row.provider"
            class="size-5 object-contain"
          />
          <Bot v-else :size="18" class="text-muted-foreground" />
        </div>
        <div class="min-w-0">
          <p class="truncate font-medium text-foreground">
            {{ row.displayName }}
          </p>
          <p class="truncate text-xs text-muted-foreground">
            {{ providerLabel(row.provider) }}
          </p>
        </div>
      </div>
    </template>

    <!-- Enabled toggle -->
    <template #cell-enabled="{ row }">
      <div @click.stop>
        <Switch
          :model-value="row.isActive"
          @update:model-value="emit('toggleActive', row)"
        />
      </div>
    </template>
  </VirtualTable>
</template>
