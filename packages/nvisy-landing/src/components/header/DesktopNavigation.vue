<script setup lang="ts">
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import ProductsDropdown from "./DesktopProducts.vue";
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

      <!-- Customers -->
      <NavigationMenuItem>
        <NavigationMenuLink
          href="/customers"
          :class="navigationMenuTriggerStyle()"
          class="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-base font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white focus:bg-neutral-50 dark:focus:bg-neutral-800 focus:text-black dark:focus:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-600 transition-all duration-200"
        >
          Customers
        </NavigationMenuLink>
      </NavigationMenuItem>

      <!-- Blog -->
      <NavigationMenuItem>
        <NavigationMenuLink
          href="/blog"
          :class="navigationMenuTriggerStyle()"
          class="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-base font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white focus:bg-neutral-50 dark:focus:bg-neutral-800 focus:text-black dark:focus:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-600 transition-all duration-200"
        >
          Blog
        </NavigationMenuLink>
      </NavigationMenuItem>

      <!-- Pricing -->
      <NavigationMenuItem>
        <NavigationMenuLink
          href="/pricing"
          :class="navigationMenuTriggerStyle()"
          class="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-base font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white focus:bg-neutral-50 dark:focus:bg-neutral-800 focus:text-black dark:focus:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-600 transition-all duration-200"
        >
          Pricing
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
