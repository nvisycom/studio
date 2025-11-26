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
      class="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-base font-light text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white focus:bg-gray-50 dark:focus:bg-neutral-800 focus:text-gray-900 dark:focus:text-white disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-gray-50 dark:data-[state=open]:bg-neutral-800 data-[state=open]:text-gray-900 dark:data-[state=open]:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 dark:focus-visible:ring-neutral-600 transition-all duration-200"
    >
      Products
    </NavigationMenuTrigger>
    <NavigationMenuContent
      class="left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto"
    >
      <div class="p-0 md:w-[700px]">
        <div class="grid gap-0 lg:grid-cols-2">
          <!-- Left Column: Platforms -->
          <div class="p-6 border-r border-gray-100 dark:border-neutral-700">
            <h3
              class="font-light text-gray-500 dark:text-neutral-400 mb-3 text-xs tracking-wide"
            >
              Platforms
            </h3>
            <div class="space-y-1">
              <NavigationMenuLink
                v-for="product in products.platforms"
                :key="product.title"
                :href="product.href"
                class="flex flex-row items-center select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white focus:bg-gray-50 dark:focus:bg-neutral-800 focus:text-gray-900 dark:focus:text-white"
              >
                <span
                  class="text-gray-400 dark:text-neutral-500 mr-3 flex-shrink-0"
                >
                  <component :is="product.icon" class="w-6 h-6" />
                </span>
                <div>
                  <div class="text-sm font-light leading-none">
                    {{ product.title }}
                  </div>
                  <p
                    class="line-clamp-2 text-xs font-light leading-snug text-gray-500 dark:text-neutral-400 mt-0.5"
                  >
                    {{ product.description }}
                  </p>
                </div>
              </NavigationMenuLink>
            </div>
          </div>

          <!-- Right Column: SDKs & Tools -->
          <div class="p-6">
            <h3
              class="font-light text-gray-500 dark:text-neutral-400 mb-3 text-xs tracking-wide"
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
                class="flex flex-row items-center select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white focus:bg-gray-50 dark:focus:bg-neutral-800 focus:text-gray-900 dark:focus:text-white"
              >
                <span
                  class="text-gray-400 dark:text-neutral-500 mr-3 flex-shrink-0"
                >
                  <component :is="product.icon" class="w-6 h-6" />
                </span>
                <div class="flex-1">
                  <div
                    class="text-sm font-light leading-none flex items-center gap-1"
                  >
                    {{ product.title }}
                    <ExternalLink
                      class="w-3 h-3 text-gray-400 dark:text-neutral-500"
                    />
                  </div>
                  <p
                    class="line-clamp-2 text-xs font-light leading-snug text-gray-500 dark:text-neutral-400 mt-0.5"
                  >
                    {{ product.description }}
                  </p>
                </div>
              </NavigationMenuLink>
            </div>
          </div>
        </div>
      </div>
    </NavigationMenuContent>
  </NavigationMenuItem>
</template>
