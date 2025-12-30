<script setup lang="ts">
import { ref } from "vue";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-vue-next";

const notificationsTab = ref("inbox");
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="sm"
        class="h-8 w-8 p-0"
        title="Notifications"
      >
        <Bell :size="16" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[400px] p-0">
      <div class="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <h3 class="font-medium text-base text-neutral-900 dark:text-white">
          Notifications
        </h3>
        <p
          class="text-sm font-light text-neutral-600 dark:text-neutral-400 mt-0.5"
        >
          Stay updated with your latest notifications
        </p>
      </div>
      <Tabs v-model="notificationsTab" class="w-full">
        <div class="px-4 pt-3">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="inbox"
          class="mt-0 p-3 max-h-[400px] overflow-y-auto"
        >
          <div class="space-y-2">
            <div
              class="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <p
                    class="font-normal text-sm text-neutral-900 dark:text-white"
                  >
                    New document uploaded
                  </p>
                  <p
                    class="text-sm font-light text-neutral-600 dark:text-neutral-400 mt-1"
                  >
                    API Documentation v2.4 has been uploaded to your workspace
                  </p>
                  <p
                    class="text-sm font-light text-neutral-500 dark:text-neutral-500 mt-2"
                  >
                    2 minutes ago
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  class="shrink-0 text-xs h-auto py-1 px-2"
                  >Mark as read</Button
                >
              </div>
            </div>
            <div
              class="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <p
                    class="font-normal text-sm text-neutral-900 dark:text-white"
                  >
                    Integration connected
                  </p>
                  <p
                    class="text-sm font-light text-neutral-600 dark:text-neutral-400 mt-1"
                  >
                    GitHub integration has been successfully connected
                  </p>
                  <p
                    class="text-sm font-light text-neutral-500 dark:text-neutral-500 mt-2"
                  >
                    1 hour ago
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  class="shrink-0 text-xs h-auto py-1 px-2"
                  >Mark as read</Button
                >
              </div>
            </div>
            <div
              class="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <p
                    class="font-normal text-sm text-neutral-900 dark:text-white"
                  >
                    Team member joined
                  </p>
                  <p
                    class="text-sm font-light text-neutral-600 dark:text-neutral-400 mt-1"
                  >
                    Jane Smith has joined your team
                  </p>
                  <p
                    class="text-sm font-light text-neutral-500 dark:text-neutral-500 mt-2"
                  >
                    3 hours ago
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  class="shrink-0 text-xs h-auto py-1 px-2"
                  >Mark as read</Button
                >
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="archive" class="mt-0 p-3">
          <div class="text-center py-12">
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              No archived notifications
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
