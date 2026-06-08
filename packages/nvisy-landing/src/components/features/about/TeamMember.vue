<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@nvisy/shared";
import LinkedInIcon from "@/assets/icons/linkedin.svg?raw";
import GitHubIcon from "@/assets/icons/github.svg?raw";

interface Props {
	name: string;
	title: string;
	image?: string;
	linkedin?: string;
	github?: string;
}

const props = defineProps<Props>();
const initials = getInitials(props.name);
</script>

<template>
  <div class="flex flex-col rounded-xl border border-border bg-card p-6">
    <Avatar class="mb-4 h-12 w-12 rounded-lg">
      <AvatarImage v-if="image" :src="image" :alt="name" class="rounded-lg" />
      <AvatarFallback
        class="rounded-lg bg-muted font-mono text-sm font-medium text-foreground/70"
      >
        {{ initials }}
      </AvatarFallback>
    </Avatar>

    <h3 class="text-sm font-medium tracking-tight">
      {{ name }}
    </h3>
    <p class="mt-0.5 text-[13px] text-foreground/50">
      {{ title }}
    </p>

    <div
      v-if="linkedin || github"
      class="mt-4 flex items-center gap-3"
    >
      <a
        v-if="linkedin"
        :href="linkedin"
        target="_blank"
        rel="noopener noreferrer"
        class="h-4 w-4 text-foreground/40 transition-colors hover:text-foreground [&>svg]:h-full [&>svg]:w-full"
        :aria-label="`${name}'s LinkedIn profile`"
        v-html="LinkedInIcon"
      />
      <a
        v-if="github"
        :href="github"
        target="_blank"
        rel="noopener noreferrer"
        class="h-4 w-4 text-foreground/40 transition-colors hover:text-foreground [&>svg]:h-full [&>svg]:w-full"
        :aria-label="`${name}'s GitHub profile`"
        v-html="GitHubIcon"
      />
    </div>
  </div>
</template>
