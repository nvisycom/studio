<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@nvisy/shared";
import LinkedInIcon from "@/assets/icons/linkedin.svg?raw";
import GitHubIcon from "@/assets/icons/github.svg?raw";

interface Props {
	name: string;
	role: string;
	image?: string;
	linkedin?: string;
	github?: string;
}

const props = defineProps<Props>();
const initials = getInitials(props.name);

// Generate unique gradient for each team member
const gradients = [
	"from-blue-400 to-purple-500",
	"from-cyan-400 to-blue-500",
	"from-purple-400 to-pink-500",
	"from-green-400 to-cyan-500",
	"from-orange-400 to-red-500",
];

// Use name hash to determine gradient
const gradientIndex =
	props.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
	gradients.length;
const gradient = gradients[gradientIndex];
</script>

<template>
  <div class="group flex flex-col items-center text-center">
    <Avatar
      class="w-40 h-40 md:w-48 md:h-48 mb-4 group-hover:scale-105 transition-transform duration-300"
    >
      <AvatarImage v-if="image" :src="image" :alt="name" />
      <AvatarFallback
        :class="`text-4xl md:text-5xl font-bold bg-gradient-to-br ${gradient} text-white`"
      >
        {{ initials }}
      </AvatarFallback>
    </Avatar>

    <h3 class="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1">
      {{ name }}
    </h3>

    <p class="text-sm md:text-base text-gray-600 dark:text-neutral-400 mb-4">
      {{ role }}
    </p>

    <div class="flex items-center gap-4">
      <a
        v-if="linkedin"
        :href="linkedin"
        class="w-6 h-6 text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-neutral-200 transition-colors"
        :aria-label="`${name}'s LinkedIn profile`"
        v-html="LinkedInIcon"
      />
      <a
        v-if="github"
        :href="github"
        class="w-6 h-6 text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-neutral-200 transition-colors"
        :aria-label="`${name}'s GitHub profile`"
        v-html="GitHubIcon"
      />
    </div>
  </div>
</template>
