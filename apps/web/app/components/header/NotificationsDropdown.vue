<script setup lang="ts">
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import { Button } from "#console/components/ui/button";
import { AppHealth } from "@/components/footer";
import { Bell, Loader2, Inbox } from "@lucide/vue";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();
const { wLink } = useWorkspaceLink();

const isOpen = ref(false);

const { notifications, unreadCount, isLoading, open } = useNotifications();

// The API ships no pre-rendered title/message — each notification carries a
// typed payload keyed by notifyType — so resolve the copy + destination once
// here and keep the template declarative. `readAt` reflects the state when the
// panel opened (the fetch precedes mark-all-read), so we can flag what was new.
const items = computed(() =>
	(notifications.value ?? []).flatMap((notification) => {
		// A notification whose stored params didn't decode has no payload and
		// can't be rendered as copy — skip it.
		if (!notification.payload) return [];
		const { titleKey, messageKey, params, to } = notificationContent(
			notification.payload,
		);
		return [
			{
				id: notification.id,
				title: t(titleKey),
				message: t(messageKey, params),
				createdAt: notification.createdAt,
				unread: !notification.readAt,
				to: to ? wLink(to) : null,
			},
		];
	}),
);

function onItemClick() {
	isOpen.value = false;
}

// NuxtLink for items that link somewhere; a plain div otherwise.
const NuxtLink = resolveComponent("NuxtLink");

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
      <!-- Header: system status dot + title. -->
      <div
        class="flex items-center gap-2 border-b border-border/50 px-4 py-3"
      >
        <AppHealth />
        <h3 class="text-sm font-medium text-foreground">
          {{ t("notifications.title") }}
        </h3>
      </div>

      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Loader2 :size="20" class="animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="items.length" class="max-h-[400px] overflow-y-auto py-1">
        <!-- Each item is a link to where the event happened; a leading dot marks
             what was unread when the panel opened. -->
        <component
          :is="item.to ? NuxtLink : 'div'"
          v-for="item in items"
          :key="item.id"
          :to="item.to ?? undefined"
          class="flex gap-2.5 px-4 py-2.5 transition-colors hover:bg-muted/50"
          :class="item.to ? 'cursor-pointer' : ''"
          @click="item.to && onItemClick()"
        >
          <span
            class="mt-1.5 size-1.5 shrink-0 rounded-full"
            :class="item.unread ? 'bg-primary' : 'bg-transparent'"
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-2">
              <p class="truncate text-sm font-medium text-foreground">
                {{ item.title }}
              </p>
              <span
                class="shrink-0 text-xs text-muted-foreground/70 tabular-nums"
              >
                {{ relativeTime(item.createdAt) }}
              </span>
            </div>
            <p class="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
              {{ item.message }}
            </p>
          </div>
        </component>
      </div>

      <div v-else class="px-4 py-12 text-center">
        <Inbox :size="28" class="mx-auto mb-3 text-muted-foreground/50" />
        <p class="text-sm text-muted-foreground">
          {{ t("notifications.empty") }}
        </p>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
