<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import ProductsDropdown from "./DesktopProducts.vue";
import ResourcesDropdown from "./DesktopResources.vue";
</script>

<template>
  <NavigationMenu
    class="relative z-10 hidden lg:flex max-w-max flex-1 items-center justify-center ml-12"
  >
    <NavigationMenuList
      class="group flex flex-1 list-none items-center justify-center gap-1"
    >
      <!-- Products -->
      <ProductsDropdown />

      <!-- Resources -->
      <ResourcesDropdown />

      <!-- Customers -->
      <NavigationMenuItem>
        <NavigationMenuLink
          href="/customers"
          class="inline-flex h-9 w-max items-center justify-center rounded-lg bg-transparent px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          Customers
        </NavigationMenuLink>
      </NavigationMenuItem>

      <!-- Pricing -->
      <NavigationMenuItem>
        <NavigationMenuLink
          href="/pricing"
          class="inline-flex h-9 w-max items-center justify-center rounded-lg bg-transparent px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          Pricing
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
