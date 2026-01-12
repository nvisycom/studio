<script setup lang="ts">
import {
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ExternalLink } from "lucide-vue-next";
import { products } from "./desktop-nav-data";
</script>

<template>
  <NavigationMenuItem>
    <NavigationMenuTrigger
      class="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-base font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white focus:bg-neutral-50 dark:focus:bg-neutral-800 focus:text-black dark:focus:text-white disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-neutral-50 dark:data-[state=open]:bg-neutral-800 data-[state=open]:text-black dark:data-[state=open]:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-600 transition-all duration-200"
    >
      Products
    </NavigationMenuTrigger>
    <NavigationMenuContent
      class="left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto md:left-1/2 md:-translate-x-1/2"
    >
      <div class="p-0 md:w-[800px]">
        <div class="grid gap-0 lg:grid-cols-2">
          <!-- Left Column: Platforms -->
          <div class="p-6 border-r border-neutral-100 dark:border-neutral-700">
            <h3
              class="font-light text-neutral-500 dark:text-neutral-400 mb-3 text-xs tracking-wide"
            >
              Platforms
            </h3>
            <div class="space-y-1">
              <NavigationMenuLink
                v-for="product in products.platforms"
                :key="product.title"
                :href="product.href"
                class="block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white focus:bg-neutral-50 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="text-neutral-400 dark:text-neutral-500 flex-shrink-0"
                  >
                    <component :is="product.icon" class="w-5 h-5" />
                  </span>
                  <div class="flex-1">
                    <div
                      class="text-sm font-medium leading-none text-neutral-800 dark:text-neutral-200"
                    >
                      {{ product.title }}
                    </div>
                    <div
                      class="text-xs text-neutral-500 dark:text-neutral-500 mt-1"
                    >
                      {{ product.description }}
                    </div>
                  </div>
                </div>
              </NavigationMenuLink>
            </div>
          </div>

          <!-- Right Column: SDKs & Tools -->
          <div class="p-6">
            <h3
              class="font-light text-neutral-500 dark:text-neutral-400 mb-3 text-xs tracking-wide"
            >
              SDKs & Tools
            </h3>
            <div class="space-y-1">
              <NavigationMenuLink
                v-for="product in products.opensource"
                :key="product.title"
                :href="product.href"
                target="_blank"
                rel="noopener noreferrer"
                class="block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white focus:bg-neutral-50 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="text-neutral-400 dark:text-neutral-500 flex-shrink-0"
                  >
                    <component :is="product.icon" class="w-5 h-5" />
                  </span>
                  <div class="flex-1">
                    <div
                      class="text-sm font-medium leading-none flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200"
                    >
                      {{ product.title }}
                      <ExternalLink
                        class="w-3 h-3 text-neutral-400 dark:text-neutral-500"
                      />
                    </div>
                    <div
                      class="text-xs text-neutral-500 dark:text-neutral-500 mt-1"
                    >
                      {{ product.description }}
                    </div>
                  </div>
                </div>
              </NavigationMenuLink>
            </div>
          </div>
        </div>
      </div>
    </NavigationMenuContent>
  </NavigationMenuItem>
</template>
