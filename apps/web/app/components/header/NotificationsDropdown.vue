<script setup lang="ts">
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "#console/components/ui/tabs";
import { Button } from "#console/components/ui/button";
import { Bell, Loader2, Inbox } from "@lucide/vue";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();

const notificationsTab = ref("inbox");
const isOpen = ref(false);

const { notifications, unreadCount, isLoading, fetchNotifications } =
	useNotifications();

// Resolve each notification's typed payload into rendered copy once, so the
// template stays declarative (the API ships no pre-rendered title/message).
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

// Fetch notifications when dropdown opens
watch(isOpen, (open) => {
	if (open) {
		fetchNotifications();
	}
});
</script>

<template>
  <DropdownMenu v-model:open="isOpen">
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        class="h-8 w-8 p-0 relative text-muted-foreground hover:text-foreground"
        :title="t('notifications.title')"
      >
        <Bell :size="16" />
        <span
          v-if="unreadCount > 0"
          class="absolute -top-0.5 -right-0.5 size-2 bg-destructive rounded-full"
        />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[380px] p-0">
      <div class="p-4 border-b border-border/50">
        <h3 class="font-medium text-sm text-foreground">
          {{ t("notifications.title") }}
        </h3>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ t("notifications.subtitle") }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Loader2 :size="20" class="animate-spin text-muted-foreground" />
      </div>

      <template v-else>
        <div class="p-2 max-h-[400px] overflow-y-auto">
          <div v-if="items.length > 0" class="space-y-1">
            <div
              v-for="item in items"
              :key="item.id"
              class="p-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-sm text-foreground">
                    {{ item.title }}
                  </p>
                  <p class="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {{ item.message }}
                  </p>
                  <p class="text-xs text-muted-foreground/70 mt-1.5">
                    {{ relativeTime(item.createdAt) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-12">
            <Inbox :size="28" class="mx-auto text-muted-foreground/50 mb-3" />
            <p class="text-sm text-muted-foreground">
              {{ t("notifications.empty") }}
            </p>
          </div>
        </div>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
