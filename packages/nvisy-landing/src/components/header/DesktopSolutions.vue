<script setup lang="ts">
import {
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ChevronRight } from "lucide-vue-next";
import { solutions } from "./desktop-nav-data";

interface BlogPost {
	title: string;
	href: string;
}

interface Props {
	blogPosts: BlogPost[];
}

const props = defineProps<Props>();
</script>

<template>
  <NavigationMenuItem>
    <NavigationMenuTrigger
      class="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-base font-light text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white focus:bg-neutral-50 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-neutral-50 dark:data-[state=open]:bg-neutral-800 data-[state=open]:text-neutral-900 dark:data-[state=open]:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-600 transition-all duration-200"
    >
      Solutions
    </NavigationMenuTrigger>
    <NavigationMenuContent
      class="left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto md:left-1/2 md:-translate-x-1/2"
    >
      <div class="p-0 md:w-[800px]">
        <div class="grid gap-0 lg:grid-cols-2">
          <!-- Left Column: Solutions 2x2 Grid -->
          <div class="p-6 border-r border-neutral-100 dark:border-neutral-700">
            <h3
              class="font-light text-neutral-500 dark:text-neutral-400 mb-4 text-xs tracking-wide"
            >
              By Use Case
            </h3>
            <div class="grid grid-cols-2 gap-3">
              <NavigationMenuLink
                v-for="solution in solutions.usecase"
                :key="solution.title"
                :href="solution.href"
                class="flex flex-col p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-sm"
              >
                <component
                  :is="solution.icon"
                  class="w-6 h-6 text-neutral-400 dark:text-neutral-500 mb-2"
                />
                <div class="flex items-center justify-between">
                  <div
                    class="text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    {{ solution.title }}
                  </div>
                  <ChevronRight
                    class="w-4 h-4 text-neutral-400 dark:text-neutral-500"
                  />
                </div>
              </NavigationMenuLink>
            </div>
          </div>

          <!-- Right Column: Blog Section -->
          <div class="p-6">
            <NavigationMenuLink
              href="/blog"
              class="inline-flex items-center font-light text-neutral-500 dark:text-neutral-400 mb-3 text-xs tracking-wide transition-colors hover:text-neutral-900 dark:hover:text-white focus:text-neutral-900 dark:focus:text-white -mt-2"
            >
              <span class="flex items-center">
                Blog
                <ChevronRight class="h-4 w-4 ml-1" />
              </span>
            </NavigationMenuLink>
            <div class="space-y-2">
              <NavigationMenuLink
                v-for="post in props.blogPosts.slice(0, 3)"
                :key="post.href"
                :href="post.href"
                class="block p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-600"
              >
                <div
                  class="text-sm font-light text-neutral-900 dark:text-white line-clamp-2"
                >
                  {{ post.title }}
                </div>
              </NavigationMenuLink>
            </div>
          </div>
        </div>
      </div>
    </NavigationMenuContent>
  </NavigationMenuItem>
</template>
