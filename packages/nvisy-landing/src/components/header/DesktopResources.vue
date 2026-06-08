<script setup lang="ts">
import {
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ExternalLink } from "@lucide/vue";
import { resources } from "./nav-data";
</script>

<template>
  <NavigationMenuItem>
    <NavigationMenuTrigger
      class="inline-flex h-8 w-max items-center justify-center rounded-md bg-transparent px-3 text-sm font-normal text-foreground/70 hover:text-foreground hover:bg-accent data-[state=open]:bg-accent data-[state=open]:text-foreground transition-colors"
    >
      Resources
    </NavigationMenuTrigger>
    <NavigationMenuContent
      class="left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out md:absolute md:w-auto md:left-1/2 md:-translate-x-1/2"
    >
      <div
        class="md:w-[720px] bg-card rounded-lg border border-border shadow-lg p-2"
      >
        <div class="grid lg:grid-cols-3">
          <div
            v-for="(column, i) in resources"
            :key="i"
            class="p-2 lg:relative"
            :class="
              i > 0
                ? 'lg:before:absolute lg:before:left-0 lg:before:top-2 lg:before:bottom-2 lg:before:w-px lg:before:bg-border'
                : ''
            "
          >
            <div class="space-y-1">
              <NavigationMenuLink
                v-for="item in column.items"
                :key="item.title"
                :href="item.href"
                :target="item.isExternal ? '_blank' : undefined"
                :rel="item.isExternal ? 'noopener noreferrer' : undefined"
                class="block select-none rounded-md p-3 no-underline outline-none transition-colors hover:bg-accent"
              >
                <div class="text-sm font-medium flex items-center gap-1.5">
                  {{ item.title }}
                  <ExternalLink
                    v-if="item.isExternal"
                    class="w-3 h-3 text-muted-foreground"
                  />
                </div>
                <div class="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {{ item.description }}
                </div>
              </NavigationMenuLink>
            </div>
          </div>
        </div>
      </div>
    </NavigationMenuContent>
  </NavigationMenuItem>
</template>
