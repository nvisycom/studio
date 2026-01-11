<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Client {
	name: string;
	logo: string;
	fallback: string;
}

interface Props {
	clients?: Client[];
}

const props = withDefaults(defineProps<Props>(), {
	clients: () => [
		{ name: "Company 1", logo: "/logos/client1.svg", fallback: "C1" },
		{ name: "Company 2", logo: "/logos/client2.svg", fallback: "C2" },
		{ name: "Company 3", logo: "/logos/client3.svg", fallback: "C3" },
		{ name: "Company 4", logo: "/logos/client4.svg", fallback: "C4" },
		{ name: "Company 5", logo: "/logos/client5.svg", fallback: "C5" },
		{ name: "Company 6", logo: "/logos/client6.svg", fallback: "C6" },
		{ name: "Company 7", logo: "/logos/client7.svg", fallback: "C7" },
		{ name: "Company 8", logo: "/logos/client8.svg", fallback: "C8" },
	],
});
</script>

<template>
  <div class="grid grid-cols-4 gap-8 md:gap-12 max-w-2xl mx-auto">
    <div
      v-for="client in clients"
      :key="client.name"
      class="flex items-center justify-center"
    >
      <Avatar class="w-16 h-16 md:w-20 md:h-20">
        <AvatarImage :src="client.logo" :alt="client.name" />
        <AvatarFallback>{{ client.fallback }}</AvatarFallback>
      </Avatar>
    </div>
  </div>
</template>
