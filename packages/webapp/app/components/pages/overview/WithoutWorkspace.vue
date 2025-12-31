<script setup lang="ts">
import { Layers, User } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import CreateWorkspaceModal from "@/components/sidebar/CreateWorkspaceModal.vue";

const { t } = useI18n();
const { user } = useAuth();

const isCreateWorkspaceModalOpen = ref(false);

const userName = computed(() => user.value?.name?.split(" ")[0] || "");
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[70vh]">
    <!-- Hero Section -->
    <div class="text-center max-w-xl mx-auto">
      <h1
        class="text-4xl font-light text-neutral-800 dark:text-neutral-200 mb-4 tracking-tight"
      >
        {{ t("overview.welcome.title")
        }}<span v-if="userName">, {{ userName }}</span
        >!
      </h1>
      <p
        class="text-lg font-light text-neutral-500 dark:text-neutral-400 mb-10 leading-relaxed"
      >
        {{ t("overview.welcome.description") }}
      </p>
      <div class="flex items-center justify-center gap-3">
        <Button
          size="lg"
          @click="isCreateWorkspaceModalOpen = true"
          class="h-12 px-8 text-base gap-2 cursor-pointer"
        >
          <Layers :size="18" />
          {{ t("overview.welcome.createWorkspace") }}
        </Button>
        <Button
          as-child
          size="lg"
          variant="outline"
          class="h-12 px-8 text-base gap-2"
        >
          <NuxtLink to="/account/general">
            <User :size="18" />
            {{ t("overview.welcome.setupProfile") }}
          </NuxtLink>
        </Button>
      </div>
    </div>

    <CreateWorkspaceModal v-model:open="isCreateWorkspaceModalOpen" />
  </div>
</template>
