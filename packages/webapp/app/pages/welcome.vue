<script setup lang="ts">
import {
	Upload,
	Key,
	Users,
	Puzzle,
	FileText,
	CheckCircle,
	ArrowRight,
	ExternalLink,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

definePageMeta({
	pageName: "Getting Started",
});

const steps = [
	{
		id: 1,
		title: "Upload Your First Document",
		description:
			"Start by uploading a document to experience our redaction capabilities",
		icon: Upload,
		action: "Upload Document",
		actionUrl: "/documents",
		color: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
		completed: false,
	},
	{
		id: 2,
		title: "Create an API Token",
		description:
			"Generate API credentials to integrate Nvisy into your applications",
		icon: Key,
		action: "Create Token",
		actionUrl: "/tokens",
		color:
			"bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
		completed: false,
	},
	{
		id: 3,
		title: "Invite Team Members",
		description:
			"Collaborate with your team by inviting members to your workspace",
		icon: Users,
		action: "Invite Members",
		actionUrl: "/members",
		color: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400",
		completed: false,
	},
	{
		id: 4,
		title: "Connect an Integration",
		description:
			"Automate workflows by connecting your favorite tools and services",
		icon: Puzzle,
		action: "Browse Integrations",
		actionUrl: "/integrations/explore",
		color:
			"bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400",
		completed: false,
	},
];

const resources = [
	{
		title: "Documentation",
		description: "Learn how to use Nvisy and integrate it into your workflow",
		url: "https://docs.nvisy.com",
	},
	{
		title: "API Reference",
		description: "Explore our REST API and code examples",
		url: "https://docs.nvisy.com/api-reference",
	},
	{
		title: "Discord Community",
		description: "Join our community and get help from other users",
		url: "https://discord.gg/nvisy",
	},
];
</script>

<template>
  <div class="flex flex-1 flex-col gap-6 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Welcome Section -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Welcome to Nvisy!</h1>
        <p class="text-neutral-600 dark:text-neutral-400 text-lg">
          Let's get you started with document redaction and automation. Follow
          these steps to make the most of your workspace.
        </p>
      </div>

      <!-- Quick Start Steps -->
      <Card
        class="mb-8 py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
          <CardDescription>
            Complete these steps to set up your workspace
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div
            v-for="(step, index) in steps"
            :key="step.id"
            class="flex items-start gap-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
          >
            <div class="flex-shrink-0">
              <div
                class="w-12 h-12 rounded-lg flex items-center justify-center"
                :class="step.color"
              >
                <component :is="step.icon" :size="24" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3
                    class="font-semibold text-neutral-900 dark:text-white mb-1"
                  >
                    {{ index + 1 }}. {{ step.title }}
                  </h3>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ step.description }}
                  </p>
                </div>
                <Button as-child size="sm" variant="outline">
                  <NuxtLink
                    :to="step.actionUrl"
                    class="flex items-center gap-2"
                  >
                    {{ step.action }}
                    <ArrowRight :size="14" />
                  </NuxtLink>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Resources Grid -->
      <Card
        class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardHeader>
          <CardTitle>Resources & Support</CardTitle>
          <CardDescription>
            Helpful links to get you up and running
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-4 md:grid-cols-3">
            <a
              v-for="resource in resources"
              :key="resource.title"
              :href="resource.url"
              target="_blank"
              rel="noopener noreferrer"
              class="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group"
            >
              <div class="flex items-start justify-between gap-2 mb-2">
                <h4 class="font-semibold text-neutral-900 dark:text-white">
                  {{ resource.title }}
                </h4>
                <ExternalLink
                  :size="16"
                  class="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors"
                />
              </div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                {{ resource.description }}
              </p>
            </a>
          </div>
        </CardContent>
      </Card>

      <!-- Help Section -->
      <div
        class="mt-8 p-6 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
      >
        <h3 class="font-semibold text-neutral-900 dark:text-white mb-2">
          Need Help?
        </h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Our support team is here to help you succeed. Reach out anytime via
          our Discord community or check out our comprehensive documentation.
        </p>
        <div class="flex gap-3">
          <Button as-child variant="outline" size="sm">
            <a
              href="https://docs.nvisy.com"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2"
            >
              <FileText :size="16" />
              View Docs
            </a>
          </Button>
          <Button as-child variant="outline" size="sm">
            <a
              href="https://discord.gg/nvisy"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2"
            >
              Join Discord
              <ExternalLink :size="14" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
