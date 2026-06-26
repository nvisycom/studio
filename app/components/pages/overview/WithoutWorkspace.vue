<script setup lang="ts">
import { Layers, User } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import CreateWorkspaceModal from "@/components/sidebar/CreateWorkspaceModal.vue";

const { t } = useI18n();
const { firstName } = useAccount();

const isCreateWorkspaceModalOpen = ref(false);
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh]">
    <!-- Hero Section -->
    <div class="text-center max-w-md mx-auto">
      <h1 class="text-2xl font-medium text-foreground mb-3 tracking-tight">
        {{ t("overview.welcome.title")
        }}<span v-if="firstName">, {{ firstName }}</span
        >!
      </h1>
      <p class="text-sm text-muted-foreground mb-8 leading-relaxed">
        {{ t("overview.welcome.description") }}
      </p>
      <div class="flex items-center justify-center gap-3">
        <Button
          size="default"
          @click="isCreateWorkspaceModalOpen = true"
          class="gap-2 cursor-pointer"
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
