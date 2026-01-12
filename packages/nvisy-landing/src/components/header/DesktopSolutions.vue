<script setup lang="ts">
import {
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ArrowRight } from "lucide-vue-next";
import { solutions } from "./desktop-nav-data";

interface BlogPost {
	title: string;
	href: string;
}

interface Props {
	blogPosts: BlogPost[];
}

const props = defineProps<Props>();

const featuredPost = props.blogPosts[0];
const remainingPosts = props.blogPosts.slice(1, 4);
</script>

<template>
  <NavigationMenuItem>
    <NavigationMenuTrigger
      class="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-base font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white focus:bg-neutral-50 dark:focus:bg-neutral-800 focus:text-black dark:focus:text-white disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-neutral-50 dark:data-[state=open]:bg-neutral-800 data-[state=open]:text-black dark:data-[state=open]:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-600 transition-all duration-200"
    >
      Solutions
    </NavigationMenuTrigger>
    <NavigationMenuContent
      class="left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto md:left-1/2 md:-translate-x-1/2"
    >
      <div class="p-0 md:w-[800px]">
        <div class="grid gap-0 lg:grid-cols-2">
          <!-- Left Column: Solutions List -->
          <div class="p-6 border-r border-neutral-100 dark:border-neutral-700">
            <!-- Industries -->
            <h3
              class="font-light text-neutral-500 dark:text-neutral-400 mb-3 text-xs tracking-wide"
            >
              Industries
            </h3>
            <div class="grid grid-cols-2 gap-1">
              <a
                v-for="solution in solutions.byUsecase"
                :key="solution.title"
                :href="solution.href"
                class="group/item flex items-center gap-3 p-2 rounded-md transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <component
                  :is="solution.icon"
                  class="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover/item:text-neutral-600 dark:group-hover/item:text-neutral-300 transition-colors duration-200 flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <div
                    class="text-sm font-medium text-neutral-800 dark:text-neutral-200 group-hover/item:text-black dark:group-hover/item:text-white transition-colors"
                  >
                    {{ solution.title }}
                  </div>
                  <div
                    v-if="solution.description"
                    class="text-xs text-neutral-500 dark:text-neutral-500 mt-1"
                  >
                    {{ solution.description }}
                  </div>
                </div>
              </a>
            </div>
          </div>

          <!-- Right Column: Blog Section -->
          <div class="p-6">
            <h3
              class="font-light text-neutral-500 dark:text-neutral-400 mb-3 text-xs tracking-wide"
            >
              <a
                href="/blog"
                class="inline-flex items-center gap-1 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                From the Blog <ArrowRight class="w-3 h-3" />
              </a>
            </h3>

            <!-- Featured Post -->
            <NavigationMenuLink
              v-if="featuredPost"
              :href="featuredPost.href"
              class="group/featured block p-4 -mx-1 rounded-xl bg-white dark:bg-neutral-800/50 shadow-sm hover:shadow-md transition-all duration-200 mb-4"
            >
              <div
                class="text-sm font-medium text-neutral-900 dark:text-white line-clamp-2 group-hover/featured:text-neutral-700 dark:group-hover/featured:text-neutral-200 transition-colors"
              >
                {{ featuredPost.title }}
              </div>
              <div
                class="flex items-center gap-1 mt-2 text-xs text-neutral-400 dark:text-neutral-500 group-hover/featured:text-neutral-600 dark:group-hover/featured:text-neutral-400 transition-colors"
              >
                Read article
                <ArrowRight class="w-3 h-3" />
              </div>
            </NavigationMenuLink>

            <!-- Remaining Posts - Minimal List -->
            <div class="space-y-3">
              <a
                v-for="post in remainingPosts"
                :key="post.href"
                :href="post.href"
                class="block text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors hover:underline line-clamp-2"
              >
                {{ post.title }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </NavigationMenuContent>
  </NavigationMenuItem>
</template>
