<script setup lang="ts">
import {
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { resources } from "./desktop-nav-data";
import { ExternalLink, ChevronRight } from "lucide-vue-next";
import { computed } from "vue";

interface BlogPost {
	title: string;
	href: string;
}

interface Props {
	blogPosts?: BlogPost[];
}

const props = defineProps<Props>();

// Use blog posts from props
const displayedBlogPosts = computed(() => props.blogPosts || []);
</script>

<template>
  <NavigationMenuItem>
    <NavigationMenuTrigger
      class="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-base font-light text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white focus:bg-gray-50 dark:focus:bg-neutral-800 focus:text-gray-900 dark:focus:text-white disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-gray-50 dark:data-[state=open]:bg-neutral-800 data-[state=open]:text-gray-900 dark:data-[state=open]:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 dark:focus-visible:ring-neutral-600 transition-all duration-200"
    >
      Resources
    </NavigationMenuTrigger>
    <NavigationMenuContent
      class="left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto"
    >
      <div class="grid gap-0 p-0 md:w-[800px] lg:grid-cols-2">
        <!-- Left side: Resource Categories -->
        <div class="p-6 border-r border-gray-100 dark:border-neutral-700">
          <div class="grid grid-cols-2 gap-10">
            <!-- Developers Section -->
            <div>
              <h3
                class="font-light text-gray-500 dark:text-neutral-400 mb-3 text-xs tracking-wide"
              >
                Developers
              </h3>
              <div class="space-y-2">
                <NavigationMenuLink
                  v-for="developer in resources.developers"
                  :key="developer.title"
                  :href="developer.href"
                  :target="developer.isExternal ? '_blank' : undefined"
                  :rel="
                    developer.isExternal ? 'noopener noreferrer' : undefined
                  "
                  class="block select-none rounded-md leading-none no-underline outline-none transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white focus:bg-gray-50 dark:focus:bg-neutral-800 focus:text-gray-900 dark:focus:text-white"
                >
                  <div class="flex items-center">
                    <span
                      class="text-gray-400 dark:text-neutral-500 mr-3 mt-0.5 flex-shrink-0"
                    >
                      <component :is="developer.icon" class="w-5 h-5" />
                    </span>
                    <div class="flex-1">
                      <div
                        class="text-sm font-light leading-none flex items-center gap-1.5"
                      >
                        {{ developer.title }}
                        <ExternalLink
                          v-if="developer.isExternal"
                          class="w-3 h-3 text-gray-400 dark:text-neutral-500"
                        />
                      </div>
                    </div>
                  </div>
                </NavigationMenuLink>
              </div>
            </div>

            <!-- Support Section -->
            <div>
              <h3
                class="font-light text-gray-500 dark:text-neutral-400 mb-3 text-xs tracking-wide"
              >
                Support
              </h3>
              <div class="space-y-2">
                <NavigationMenuLink
                  v-for="support in resources.support"
                  :key="support.title"
                  :href="support.href"
                  :target="support.isExternal ? '_blank' : undefined"
                  :rel="support.isExternal ? 'noopener noreferrer' : undefined"
                  class="block select-none rounded-md leading-none no-underline outline-none transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white focus:bg-gray-50 dark:focus:bg-neutral-800 focus:text-gray-900 dark:focus:text-white"
                >
                  <div class="flex items-center">
                    <span
                      class="text-gray-400 dark:text-neutral-500 mr-3 mt-0.5 flex-shrink-0 items-center"
                    >
                      <component :is="support.icon" class="w-5 h-5" />
                    </span>
                    <div class="flex-1">
                      <div
                        class="text-sm font-light leading-none flex items-center gap-1.5"
                      >
                        {{ support.title }}
                        <ExternalLink
                          v-if="support.isExternal"
                          class="w-3 h-3 text-gray-400 dark:text-neutral-500"
                        />
                      </div>
                    </div>
                  </div>
                </NavigationMenuLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Right side: Blog Section -->
        <div class="bg-gray-50/30 dark:bg-neutral-800/10 px-6 pb-6 pt-4">
          <!-- Blog Header -->
          <NavigationMenuLink
            href="/blog"
            class="inline-flex items-center font-light text-gray-500 dark:text-neutral-400 mb-1 text-xs tracking-wide transition-colors hover:text-gray-900 dark:hover:text-white focus:text-gray-900 dark:focus:text-white"
          >
            <span class="flex items-center">
              Blog
              <ChevronRight class="h-4 w-4 ml-1" />
            </span>
          </NavigationMenuLink>

          <!-- Latest Blog Posts -->
          <div class="space-y-1">
            <NavigationMenuLink
              v-for="post in displayedBlogPosts"
              :key="post.title"
              :href="post.href"
              class="block select-none rounded-md leading-none no-underline outline-none transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/30 hover:text-gray-900 dark:hover:text-white focus:bg-gray-50 dark:focus:bg-neutral-800/30 focus:text-gray-900 dark:focus:text-white"
            >
              <div class="text-sm font-light leading-tight">
                {{ post.title }}
              </div>
            </NavigationMenuLink>
          </div>
        </div>
      </div>
    </NavigationMenuContent>
  </NavigationMenuItem>
</template>
