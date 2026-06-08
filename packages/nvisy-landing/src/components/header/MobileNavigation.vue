<script setup lang="ts">
import { watch, onMounted, onUnmounted } from "vue";
import { Menu, X } from "@lucide/vue";
import { useMobileMenu } from "./useMobileMenu.ts";
import { products } from "./nav-data";

defineProps<{
	menuOnly?: boolean;
}>();

const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileMenu();

// Disable body scroll when menu is open
watch(mobileMenuOpen, (isOpen) => {
	if (isOpen) {
		document.body.style.overflow = "hidden";
	} else {
		document.body.style.overflow = "";
	}
});

// Close menu and restore scroll when resizing to desktop
const handleResize = () => {
	if (window.innerWidth >= 1024 && mobileMenuOpen.value) {
		closeMobileMenu();
	}
};

onMounted(() => {
	window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
	window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <!-- Mobile Menu Button -->
  <button
    v-if="!menuOnly"
    @click="toggleMobileMenu"
    :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
    :aria-expanded="mobileMenuOpen"
    class="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-accent rounded-md"
  >
    <X v-if="mobileMenuOpen" class="w-5 h-5" aria-hidden="true" />
    <Menu v-else class="w-5 h-5" aria-hidden="true" />
  </button>

  <!-- Mobile Navigation Menu - Full screen overlay -->
  <div
    v-if="menuOnly && mobileMenuOpen"
    class="lg:hidden fixed inset-0 top-16 z-40 bg-background"
  >
    <nav class="h-full flex flex-col px-6 py-6">
      <!-- Product Section -->
      <div class="mb-6">
        <h3
          class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3"
        >
          Product
        </h3>
        <div class="space-y-0.5">
          <a
            v-for="product in products.flatMap((c) => c.items)"
            :key="product.title"
            :href="product.href"
            :target="product.isExternal ? '_blank' : undefined"
            :rel="product.isExternal ? 'noopener noreferrer' : undefined"
            class="block text-xl font-medium text-foreground hover:text-foreground/70 transition-colors py-1.5"
          >
            {{ product.title }}
          </a>
          <a
            href="/pricing"
            class="block text-xl font-medium text-foreground hover:text-foreground/70 transition-colors py-1.5"
          >
            Pricing
          </a>
        </div>
      </div>

      <!-- Resources Section -->
      <div class="mb-6">
        <h3
          class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3"
        >
          Resources
        </h3>
        <div class="space-y-0.5">
          <a
            href="https://docs.nvisy.com"
            target="_blank"
            rel="noopener noreferrer"
            class="block text-xl font-medium text-foreground hover:text-foreground/70 transition-colors py-1.5"
          >
            Docs
          </a>
          <a
            href="/blog"
            class="block text-xl font-medium text-foreground hover:text-foreground/70 transition-colors py-1.5"
          >
            Blog
          </a>
          <a
            href="/changelog"
            class="block text-xl font-medium text-foreground hover:text-foreground/70 transition-colors py-1.5"
          >
            Changelog
          </a>
          <a
            href="/security"
            class="block text-xl font-medium text-foreground hover:text-foreground/70 transition-colors py-1.5"
          >
            Security
          </a>
          <a
            href="https://nvisy.openstatus.dev"
            target="_blank"
            rel="noopener noreferrer"
            class="block text-xl font-medium text-foreground hover:text-foreground/70 transition-colors py-1.5"
          >
            Status
          </a>
        </div>
      </div>

      <!-- Company Section -->
      <div>
        <h3
          class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3"
        >
          Company
        </h3>
        <div class="space-y-0.5">
          <a
            href="/about"
            class="block text-xl font-medium text-foreground hover:text-foreground/70 transition-colors py-1.5"
          >
            About
          </a>
          <a
            href="/customers"
            class="block text-xl font-medium text-foreground hover:text-foreground/70 transition-colors py-1.5"
          >
            Customers
          </a>
          <a
            href="/contact"
            class="block text-xl font-medium text-foreground hover:text-foreground/70 transition-colors py-1.5"
          >
            Contact
          </a>
        </div>
      </div>
    </nav>
  </div>
</template>
