<script setup lang="ts">
import { FolderSync, Loader2 } from "@lucide/vue";
import { toast } from "vue-sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import { Button } from "#console/components/ui/button";

/**
 * Desktop-only card for the watched folder: files dropped into the chosen folder
 * auto-upload to this workspace. Shown on the shared Data settings page (gated by
 * `usePlatform().isDesktop`); the Tauri access is behind
 * {@link useWatchedFolder}, so this imports no Tauri and is inert on the web.
 */
const props = defineProps<{
	/** The workspace a newly-set folder feeds (the one being configured). */
	workspaceSlug: string;
}>();

const { t } = useI18n();
const { watchedFolder } = useWatchedFolder();

const config = ref<{ folder: string; workspaceSlug: string } | null>(null);
const busy = ref(false);

onMounted(async () => {
	const get = watchedFolder.value.get;
	if (get) config.value = await get().catch(() => null);
});

// Whether the current watch feeds a *different* workspace than this page's.
const boundElsewhere = computed(
	() => !!config.value && config.value.workspaceSlug !== props.workspaceSlug,
);

async function choose() {
	const set = watchedFolder.value.set;
	if (!set || busy.value) return;
	busy.value = true;
	try {
		const result = await set(props.workspaceSlug);
		if (result) config.value = result; // null = the user cancelled the picker
	} catch (err) {
		toast.error(t("settings.watchedFolder.errors.setFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	} finally {
		busy.value = false;
	}
}

async function stop() {
	const clear = watchedFolder.value.clear;
	if (!clear || busy.value) return;
	busy.value = true;
	try {
		await clear();
		config.value = null;
	} catch (err) {
		toast.error(t("settings.watchedFolder.errors.clearFailed"), {
			description: getErrorMessage(err, t("common.errors.tryAgain")),
		});
	} finally {
		busy.value = false;
	}
}
</script>

<template>
  <Card class="py-0 pt-6 rounded-xl border-border/50">
    <CardHeader class="pb-4">
      <CardTitle
        class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
        >{{ t("settings.watchedFolder.title") }}</CardTitle
      >
      <CardDescription class="text-sm">{{
        t("settings.watchedFolder.description")
      }}</CardDescription>
    </CardHeader>
    <CardContent class="pb-6">
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0 space-y-0.5">
          <p class="text-sm font-medium text-foreground">
            <span v-if="config" class="flex items-center gap-2">
              <FolderSync :size="15" class="shrink-0 text-muted-foreground" />
              <span class="truncate font-mono text-xs">{{ config.folder }}</span>
            </span>
            <span v-else class="text-muted-foreground">{{
              t("settings.watchedFolder.none")
            }}</span>
          </p>
          <p v-if="boundElsewhere" class="text-xs text-amber-600">
            {{ t("settings.watchedFolder.boundElsewhere") }}
          </p>
          <p v-else class="text-xs text-muted-foreground">
            {{ t("settings.watchedFolder.hint") }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <Button
            v-if="config"
            variant="ghost"
            size="sm"
            :disabled="busy"
            @click="stop"
          >
            {{ t("settings.watchedFolder.stop") }}
          </Button>
          <Button size="sm" :disabled="busy" @click="choose">
            <Loader2 v-if="busy" :size="15" class="mr-1.5 animate-spin" />
            {{
              config
                ? t("settings.watchedFolder.change")
                : t("settings.watchedFolder.choose")
            }}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
