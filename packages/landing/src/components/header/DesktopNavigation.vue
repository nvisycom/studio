<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import ProductsDropdown from "./DesktopProducts.vue";
import SolutionsDropdown from "./DesktopSolutions.vue";
import ResourcesDropdown from "./DesktopResources.vue";

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
  <NavigationMenu
    class="relative z-10 hidden lg:flex max-w-max flex-1 items-center justify-center ml-20"
  >
    <NavigationMenuList
      class="group flex flex-1 list-none items-center justify-center space-x-1"
    >
      <!-- Products -->
      <ProductsDropdown />

      <!-- Solutions -->
      <SolutionsDropdown :blogPosts="props.blogPosts" />

      <!-- Resources -->
      <ResourcesDropdown />

      <!-- Pricing -->
      <NavigationMenuItem>
        <NavigationMenuLink
          href="/pricing"
          :class="navigationMenuTriggerStyle()"
          class="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-base font-light text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white focus:bg-gray-50 dark:focus:bg-neutral-800 focus:text-gray-900 dark:focus:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 dark:focus-visible:ring-neutral-600 transition-all duration-200"
        >
          Pricing
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
