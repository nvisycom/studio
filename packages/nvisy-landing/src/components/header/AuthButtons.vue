<script setup lang="ts">
import { ref, onMounted } from "vue";

const isLoggedIn = ref(false);

const checkAuthStatus = () => {
	// Check for auth cookie set by app.nvisy.com
	isLoggedIn.value = document.cookie
		.split("; ")
		.some((row) => row.startsWith("nvisy_auth="));
};

onMounted(() => {
	checkAuthStatus();
});
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Logged in: Show Docs and Open App -->
    <template v-if="isLoggedIn">
      <a
        href="https://docs.nvisy.com"
        target="_blank"
        rel="noopener noreferrer"
        class="hidden sm:inline-flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-1.5 rounded-md transition-colors"
      >
        Docs
      </a>
      <a
        href="https://app.nvisy.com"
        class="inline-flex items-center justify-center bg-foreground text-background hover:opacity-90 font-medium px-5 py-1.5 text-sm rounded-md transition-all shadow-sm"
      >
        Open App
      </a>
    </template>

    <!-- Not logged in: Show Log in and Sign up -->
    <template v-else>
      <a
        href="https://app.nvisy.com/auth/login"
        class="hidden sm:inline-flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-1.5 rounded-md transition-colors"
      >
        Log in
      </a>
      <a
        href="https://app.nvisy.com/auth/signup"
        class="inline-flex items-center justify-center bg-foreground text-background hover:opacity-90 font-medium px-5 py-1.5 text-sm rounded-md transition-all shadow-sm"
      >
        Sign up
      </a>
    </template>
  </div>
</template>
