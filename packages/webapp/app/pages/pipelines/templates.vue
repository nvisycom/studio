<script setup lang="ts">
import { ref, computed } from "vue";
import {
	Search,
	ArrowLeft,
	Split,
	Merge,
	Edit3,
	FileOutput,
	ScanText,
	FileText,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

definePageMeta({
	pageCategory: "Pipelines",
});

interface PipelineTemplate {
	id: string;
	name: string;
	description: string;
	icon: any;
	color: string;
	category: string;
	estimatedTime: string;
	popularity: "high" | "medium" | "low";
}

const searchQuery = ref("");

const templates = ref<PipelineTemplate[]>([
	{
		id: "1",
		name: "Split",
		description: "Split multi-page documents into individual pages or sections",
		icon: Split,
		color: "bg-blue-600",
		category: "Processing",
		estimatedTime: "2 min",
		popularity: "high",
	},
	{
		id: "2",
		name: "Merge",
		description: "Combine multiple documents into a single file",
		icon: Merge,
		color: "bg-purple-600",
		category: "Processing",
		estimatedTime: "3 min",
		popularity: "high",
	},
	{
		id: "3",
		name: "Edit",
		description: "Apply redactions, annotations, and modifications",
		icon: Edit3,
		color: "bg-green-600",
		category: "Processing",
		estimatedTime: "5 min",
		popularity: "high",
	},
	{
		id: "4",
		name: "Extract",
		description: "Extract text, images, or specific data from documents",
		icon: FileOutput,
		color: "bg-yellow-600",
		category: "Processing",
		estimatedTime: "4 min",
		popularity: "medium",
	},
	{
		id: "5",
		name: "Parse",
		description: "Analyze document structure and extract structured data",
		icon: ScanText,
		color: "bg-orange-600",
		category: "Processing",
		estimatedTime: "6 min",
		popularity: "medium",
	},
	{
		id: "6",
		name: "Summarize",
		description: "Generate AI-powered summaries of document content",
		icon: FileText,
		color: "bg-indigo-600",
		category: "AI",
		estimatedTime: "8 min",
		popularity: "high",
	},
]);

const filteredTemplates = computed(() => {
	if (!searchQuery.value) return templates.value;

	const query = searchQuery.value.toLowerCase();
	return templates.value.filter(
		(template) =>
			template.name.toLowerCase().includes(query) ||
			template.description.toLowerCase().includes(query) ||
			template.category.toLowerCase().includes(query),
	);
});

function useTemplate(template: PipelineTemplate) {
	console.log("Using template:", template.name);
	// TODO: Implement template usage
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6"
      >
        <Button as-child variant="outline">
          <NuxtLink to="/pipelines" class="flex items-center gap-2">
            <ArrowLeft :size="16" />
            Back to Pipelines
          </NuxtLink>
        </Button>

        <div class="relative flex-1">
          <Search
            :size="16"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <Input
            v-model="searchQuery"
            placeholder="Search templates..."
            class="pl-10"
          />
        </div>
      </div>

      <!-- Templates Grid -->
      <div class="grid gap-4 md:grid-cols-2">
        <Card
          v-for="template in filteredTemplates"
          :key="template.id"
          class="hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
          @click="useTemplate(template)"
        >
          <CardHeader class="flex-1">
            <div class="flex items-start gap-3">
              <div class="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <component
                  :is="template.icon"
                  :size="24"
                  class="text-neutral-900 dark:text-white"
                />
              </div>
              <div class="flex-1">
                <CardTitle class="text-base mb-1">
                  {{ template.name }}
                </CardTitle>
                <CardDescription class="text-sm">
                  {{ template.description }}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent class="pt-0">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Badge variant="secondary" class="text-xs">
                  {{ template.category }}
                </Badge>
              </div>
              <span class="text-xs text-neutral-600 dark:text-neutral-400">
                ~{{ template.estimatedTime }} setup
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        v-if="filteredTemplates.length === 0"
        class="text-center py-12 text-neutral-500"
      >
        No templates found matching your search
      </div>
    </div>
  </div>
</template>
