<script setup lang="ts">
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import { Button } from "#console/components/ui/button";
import { Bell, Loader2, Inbox } from "@lucide/vue";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();

const isOpen = ref(false);

const { notifications, unreadCount, isLoading, open } = useNotifications();

// The API ships no pre-rendered title/message — each notification carries a
// typed payload keyed by notifyType — so resolve the copy once here and keep
// the template declarative.
const items = computed(() =>
	(notifications.value ?? []).map((notification) => {
		const { titleKey, messageKey, params } = notificationContent(
			notification.payload,
		);
		return {
			id: notification.id,
			title: t(titleKey),
			message: t(messageKey, params),
			createdAt: notification.createdAt,
		};
	}),
);

// Cap the badge so a large backlog stays a single digit-pair.
const badgeLabel = computed(() =>
	unreadCount.value > 99 ? "99+" : String(unreadCount.value),
);

// Load the list (and mark read) when the dropdown opens.
watch(isOpen, (opened) => {
	if (opened) open();
});
</script>

<template>
  <DropdownMenu v-model:open="isOpen">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon-sm"
        class="relative rounded-full text-muted-foreground hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
        :title="t('notifications.title')"
      >
        <Bell :size="16" />
        <span
          v-if="unreadCount > 0"
          class="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium leading-none text-white"
        >
          {{ badgeLabel }}
        </span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[380px] p-0">
      <div class="border-b border-border/50 p-4">
        <h3 class="text-sm font-medium text-foreground">
          {{ t("notifications.title") }}
        </h3>
        <p class="mt-0.5 text-xs text-muted-foreground">
          {{ t("notifications.subtitle") }}
        </p>
      </div>

      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Loader2 :size="20" class="animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="items.length" class="max-h-[400px] overflow-y-auto p-2">
        <div
          v-for="item in items"
          :key="item.id"
          class="cursor-pointer rounded-md p-3 transition-colors hover:bg-muted/50"
        >
          <p class="text-sm font-medium text-foreground">
            {{ item.title }}
          </p>
          <p class="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {{ item.message }}
          </p>
          <p class="mt-1.5 text-xs text-muted-foreground/70">
            {{ relativeTime(item.createdAt) }}
          </p>
        </div>
      </div>

      <div v-else class="py-12 text-center">
        <Inbox :size="28" class="mx-auto mb-3 text-muted-foreground/50" />
        <p class="text-sm text-muted-foreground">
          {{ t("notifications.empty") }}
        </p>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
