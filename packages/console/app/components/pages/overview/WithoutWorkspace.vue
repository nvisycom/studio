<script setup lang="ts">
import { Layers, User } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import CreateWorkspaceModal from "#console/components/common/CreateWorkspaceModal.vue";

const { t } = useI18n();
const { firstName } = useAccount();

const isCreateWorkspaceModalOpen = ref(false);
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center">
    <div class="mx-auto w-full max-w-md text-center">
      <h1 class="mb-3 text-2xl font-semibold tracking-tight text-foreground">
        {{ t("overview.welcome.titleFirst")
        }}<span v-if="firstName">, {{ firstName }}</span
        >!
      </h1>
      <p class="mb-8 text-sm leading-relaxed text-muted-foreground">
        {{ t("overview.welcome.description") }}
      </p>

      <div class="flex items-center justify-center gap-3">
        <Button
          size="default"
          class="cursor-pointer gap-2"
          @click="isCreateWorkspaceModalOpen = true"
        >
          <Layers :size="16" />
          {{ t("overview.welcome.createWorkspace") }}
        </Button>
        <Button as-child size="default" variant="outline" class="gap-2">
          <NuxtLink to="/account/general">
            <User :size="16" />
            {{ t("overview.welcome.setupProfile") }}
          </NuxtLink>
        </Button>
      </div>
    </div>

    <CreateWorkspaceModal v-model:open="isCreateWorkspaceModalOpen" />
  </div>
</template>
