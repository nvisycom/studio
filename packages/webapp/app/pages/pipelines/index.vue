<script setup lang="ts">
import { ref } from "vue";
import {
	Play,
	Pause,
	MoreVertical,
	Plus,
	CheckCircle,
	XCircle,
	Clock,
	ExternalLink,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";

definePageMeta({
	pageName: "Pipelines",
});

interface Pipeline {
	id: string;
	name: string;
	description: string;
	status: "active" | "paused" | "failed";
	lastRun: Date;
	runsCount: number;
	successRate: string;
}

const activePipelines = ref<Pipeline[]>([
	{
		id: "1",
		name: "Document Processing Pipeline",
		description: "Automated redaction and classification workflow",
		status: "active",
		lastRun: new Date(Date.now() - 15 * 60000),
		runsCount: 1234,
		successRate: "98.5%",
	},
	{
		id: "2",
		name: "Daily Report Generation",
		description: "Generate and distribute daily analytics reports",
		status: "active",
		lastRun: new Date(Date.now() - 2 * 3600000),
		runsCount: 456,
		successRate: "100%",
	},
	{
		id: "3",
		name: "Email Integration Sync",
		description: "Sync documents from email attachments",
		status: "paused",
		lastRun: new Date(Date.now() - 24 * 3600000),
		runsCount: 789,
		successRate: "95.2%",
	},
]);

function getStatusIcon(status: string) {
	switch (status) {
		case "active":
			return CheckCircle;
		case "failed":
			return XCircle;
		default:
			return Clock;
	}
}

function getStatusClass(status: string) {
	switch (status) {
		case "active":
			return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
		case "failed":
			return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
		default:
			return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
	}
}

function formatTime(date: Date) {
	const now = Date.now();
	const diff = now - date.getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	return `${days}d ago`;
}

function togglePipeline(pipeline: Pipeline) {
	if (pipeline.status === "active") {
		pipeline.status = "paused";
	} else {
		pipeline.status = "active";
	}
}

function createPipeline() {
	console.log("Creating new pipeline");
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Active Pipelines -->
      <Card
        v-if="activePipelines.length > 0"
        class="mb-8 py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Active Pipelines</CardTitle>
              <CardDescription>
                {{ activePipelines.length }} pipeline{{
                  activePipelines.length !== 1 ? "s" : ""
                }}
                running
              </CardDescription>
            </div>
            <Button @click="createPipeline">
              <Plus :size="16" class="mr-2" />
              New Pipeline
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead class="w-[100px]">Status</TableHead>
                <TableHead class="w-[120px]">Last Run</TableHead>
                <TableHead class="w-[80px]">Runs</TableHead>
                <TableHead class="w-[100px]">Success Rate</TableHead>
                <TableHead class="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="pipeline in activePipelines" :key="pipeline.id">
                <TableCell class="font-medium">
                  {{ pipeline.name }}
                </TableCell>
                <TableCell class="text-neutral-600 dark:text-neutral-400">
                  {{ pipeline.description }}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    :class="getStatusClass(pipeline.status)"
                    class="flex items-center gap-1 w-fit"
                  >
                    <component
                      :is="getStatusIcon(pipeline.status)"
                      :size="12"
                    />
                    {{ pipeline.status }}
                  </Badge>
                </TableCell>
                <TableCell
                  class="text-sm text-neutral-600 dark:text-neutral-400"
                >
                  {{ formatTime(pipeline.lastRun) }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ pipeline.runsCount.toLocaleString() }}
                </TableCell>
                <TableCell class="text-sm font-medium">
                  {{ pipeline.successRate }}
                </TableCell>
                <TableCell class="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="sm">
                        <MoreVertical :size="16" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="togglePipeline(pipeline)">
                        <component
                          :is="
                            pipeline.status === 'active' ? Pause : Play
                          "
                          :size="16"
                          class="mr-2"
                        />
                        {{ pipeline.status === "active" ? "Pause" : "Resume" }}
                      </DropdownMenuItem>
                      <DropdownMenuItem> View Details </DropdownMenuItem>
                      <DropdownMenuItem> Edit </DropdownMenuItem>
                      <DropdownMenuItem class="text-red-600 dark:text-red-400">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter
          class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
        >
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Pipelines run automatically based on their configured schedules and
            triggers.
            <a
              href="https://docs.nvisy.com/pipelines"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-neutral-900 dark:text-white hover:underline font-medium"
            >
              Documentation
              <ExternalLink :size="12" />
            </a>
          </p>
        </CardFooter>
      </Card>

      <Card
        v-else
        class="mb-8 pt-6 py-0 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardContent class="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No Pipelines</EmptyTitle>
              <EmptyDescription>
                Get started by creating your first pipeline
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button @click="createPipeline">
                <Plus :size="16" class="mr-2" />
                Create Pipeline
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
