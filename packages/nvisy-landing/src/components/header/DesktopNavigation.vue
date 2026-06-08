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
    class="relative z-10 hidden lg:flex max-w-max items-center"
  >
    <NavigationMenuList
      class="group flex list-none items-center gap-0.5"
    >
      <!-- Products -->
      <ProductsDropdown />

      <!-- Resources -->
      <ResourcesDropdown />

      <!-- Customers -->
      <NavigationMenuItem>
        <NavigationMenuLink
          href="/customers"
          class="inline-flex h-8 w-max items-center justify-center rounded-md bg-transparent px-3 text-sm font-normal text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
        >
          Customers
        </NavigationMenuLink>
      </NavigationMenuItem>

      <!-- Pricing -->
      <NavigationMenuItem>
        <NavigationMenuLink
          href="/pricing"
          class="inline-flex h-8 w-max items-center justify-center rounded-md bg-transparent px-3 text-sm font-normal text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
        >
          Pricing
        </NavigationMenuLink>
      </NavigationMenuItem>

      <!-- Contact -->
      <NavigationMenuItem>
        <NavigationMenuLink
          href="/contact"
          class="inline-flex h-8 w-max items-center justify-center rounded-md bg-transparent px-3 text-sm font-normal text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
        >
          Contact
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
