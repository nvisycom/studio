<script setup lang="ts">
import {
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ExternalLink } from "lucide-vue-next";
import { resources } from "./desktop-nav-data";
</script>

<template>
  <NavigationMenuItem>
    <NavigationMenuTrigger
      class="inline-flex h-9 w-max items-center justify-center rounded-lg bg-transparent px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent data-[state=open]:bg-accent data-[state=open]:text-foreground transition-colors"
    >
      Resources
    </NavigationMenuTrigger>
    <NavigationMenuContent
      class="left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto md:left-1/2 md:-translate-x-1/2"
    >
      <div
        class="md:w-[500px] bg-card rounded-xl border border-border shadow-lg overflow-hidden"
      >
        <div class="grid lg:grid-cols-2">
          <!-- Developers Column -->
          <div class="p-4">
            <h3
              class="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider px-2"
            >
              Developers
            </h3>
            <div class="space-y-1">
              <NavigationMenuLink
                v-for="item in resources.developers"
                :key="item.title"
                :href="item.href"
                :target="item.isExternal ? '_blank' : undefined"
                :rel="item.isExternal ? 'noopener noreferrer' : undefined"
                class="block select-none rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent"
              >
                <div class="flex items-center gap-3">
                  <span class="text-muted-foreground flex-shrink-0">
                    <component :is="item.icon" class="w-5 h-5" />
                  </span>
                  <div class="flex-1">
                    <div class="text-sm font-medium flex items-center gap-1.5">
                      {{ item.title }}
                      <ExternalLink
                        v-if="item.isExternal"
                        class="w-3 h-3 text-muted-foreground"
                      />
                    </div>
                    <div class="text-xs text-muted-foreground mt-0.5">
                      {{ item.description }}
                    </div>
                  </div>
                </div>
              </NavigationMenuLink>
            </div>
          </div>

          <!-- Company Column -->
          <div class="p-4 bg-accent/30">
            <h3
              class="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider px-2"
            >
              Company
            </h3>
            <div class="space-y-1">
              <NavigationMenuLink
                v-for="item in resources.support"
                :key="item.title"
                :href="item.href"
                :target="item.isExternal ? '_blank' : undefined"
                :rel="item.isExternal ? 'noopener noreferrer' : undefined"
                class="block select-none rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent"
              >
                <div class="flex items-center gap-3">
                  <span class="text-muted-foreground flex-shrink-0">
                    <component :is="item.icon" class="w-5 h-5" />
                  </span>
                  <div class="flex-1">
                    <div class="text-sm font-medium flex items-center gap-1.5">
                      {{ item.title }}
                      <ExternalLink
                        v-if="item.isExternal"
                        class="w-3 h-3 text-muted-foreground"
                      />
                    </div>
                    <div class="text-xs text-muted-foreground mt-0.5">
                      {{ item.description }}
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
