<script setup lang="ts">
import { ref, computed } from "vue";
import {
	Search,
	ArrowLeft,
	Eye,
	Copy,
	Check,
	Loader2,
	Play,
	Clock,
	XCircle,
	CheckCircle,
} from "lucide-vue-next";
import { formatRelativeTime } from "@/utils/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const { t } = useI18n();

useHead({ title: "Workflow Runs" });

definePageMeta({
	pageCategory: "Automation",
});

// Mock data for workflow runs (replace with actual SDK composable when available)
interface WorkflowRun {
	id: string;
	workflowId: string;
	workflowName: string;
	status: "pending" | "running" | "completed" | "failed" | "cancelled";
	startedAt: string;
	completedAt: string | null;
	documentsProcessed: number;
	documentsTotal: number;
	triggeredBy: "manual" | "schedule" | "api";
}

const isLoading = ref(false);

const runs = ref<WorkflowRun[]>([
	{
		id: "run-001",
		workflowId: "wf-001",
		workflowName: "Invoice Processing",
		status: "completed",
		startedAt: new Date(Date.now() - 3600000).toISOString(),
		completedAt: new Date(Date.now() - 3500000).toISOString(),
		documentsProcessed: 150,
		documentsTotal: 150,
		triggeredBy: "schedule",
	},
	{
		id: "run-002",
		workflowId: "wf-002",
		workflowName: "Contract Analysis",
		status: "running",
		startedAt: new Date(Date.now() - 1800000).toISOString(),
		completedAt: null,
		documentsProcessed: 45,
		documentsTotal: 100,
		triggeredBy: "manual",
	},
	{
		id: "run-003",
		workflowId: "wf-001",
		workflowName: "Invoice Processing",
		status: "failed",
		startedAt: new Date(Date.now() - 7200000).toISOString(),
		completedAt: new Date(Date.now() - 7100000).toISOString(),
		documentsProcessed: 23,
		documentsTotal: 50,
		triggeredBy: "api",
	},
	{
		id: "run-004",
		workflowId: "wf-003",
		workflowName: "Document Classification",
		status: "pending",
		startedAt: new Date(Date.now() - 300000).toISOString(),
		completedAt: null,
		documentsProcessed: 0,
		documentsTotal: 200,
		triggeredBy: "schedule",
	},
]);

const searchQuery = ref("");
const statusFilter = ref("all");
const dateRange = ref("24h");
const selectedRuns = ref<Set<string>>(new Set());

const filteredRuns = computed(() => {
	let filtered = runs.value;

	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase();
		filtered = filtered.filter(
			(run) =>
				run.workflowName.toLowerCase().includes(query) ||
				run.id.toLowerCase().includes(query),
		);
	}

	if (statusFilter.value !== "all") {
		filtered = filtered.filter((run) => run.status === statusFilter.value);
	}

	return filtered.sort(
		(a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
	);
});

function toggleRunSelection(runId: string) {
	if (selectedRuns.value.has(runId)) {
		selectedRuns.value.delete(runId);
	} else {
		selectedRuns.value.add(runId);
	}
}

function toggleAllRuns() {
	if (selectedRuns.value.size === filteredRuns.value.length) {
		selectedRuns.value.clear();
	} else {
		selectedRuns.value = new Set(filteredRuns.value.map((run) => run.id));
	}
}

const allSelected = computed(
	() =>
		filteredRuns.value.length > 0 &&
		selectedRuns.value.size === filteredRuns.value.length,
);

const logsCopied = ref(false);

function copyLogs() {
	logsCopied.value = true;
	setTimeout(() => {
		logsCopied.value = false;
	}, 2000);
}

function viewRunDetails(run: WorkflowRun) {
	console.log("View details:", run);
}

function copyRunDetails(_run: WorkflowRun) {
	// TODO: Implement copy run details to clipboard
}

function formatDuration(
	startedAt: string,
	completedAt: string | null,
): string {
	if (!completedAt) return "-";
	const start = new Date(startedAt).getTime();
	const end = new Date(completedAt).getTime();
	const diff = end - start;
	const minutes = Math.floor(diff / 60000);
	const seconds = Math.floor((diff % 60000) / 1000);
	return `${minutes}m ${seconds}s`;
}

function getStatusIcon(status: WorkflowRun["status"]) {
	switch (status) {
		case "running":
			return { icon: Play, class: "text-blue-500" };
		case "pending":
			return { icon: Clock, class: "text-yellow-500" };
		case "completed":
			return { icon: CheckCircle, class: "text-green-500" };
		case "failed":
			return { icon: XCircle, class: "text-red-500" };
		case "cancelled":
			return { icon: XCircle, class: "text-muted-foreground" };
		default:
			return { icon: Clock, class: "text-muted-foreground" };
	}
}

function getProgressPercent(run: WorkflowRun): number {
	if (run.documentsTotal === 0) return 0;
	return Math.round((run.documentsProcessed / run.documentsTotal) * 100);
}
</script>

<template>
	<div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
		<div class="max-w-6xl mx-auto w-full">
			<!-- Loading State -->
			<div v-if="isLoading" class="flex items-center justify-center py-12">
				<Loader2 :size="24" class="animate-spin text-muted-foreground" />
			</div>

			<template v-else>
				<!-- Search and Filters -->
				<div class="flex items-center gap-3 mb-6 flex-wrap">
					<Button as-child variant="outline" class="font-normal">
						<NuxtLink to="/workflows" class="flex items-center gap-2">
							<ArrowLeft :size="16" />
							Back to Workflows
						</NuxtLink>
					</Button>

					<div class="flex-1 min-w-[200px]">
						<div class="relative">
							<Search
								:size="16"
								class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								v-model="searchQuery"
								placeholder="Search runs..."
								class="pl-10 h-9"
							/>
						</div>
					</div>

					<Select v-model="statusFilter">
						<SelectTrigger class="w-[150px] h-9 text-sm">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all" class="text-sm font-normal"
								>All Status</SelectItem
							>
							<SelectItem value="pending" class="text-sm font-normal"
								>Pending</SelectItem
							>
							<SelectItem value="running" class="text-sm font-normal"
								>Running</SelectItem
							>
							<SelectItem value="completed" class="text-sm font-normal"
								>Completed</SelectItem
							>
							<SelectItem value="failed" class="text-sm font-normal"
								>Failed</SelectItem
							>
							<SelectItem value="cancelled" class="text-sm font-normal"
								>Cancelled</SelectItem
							>
						</SelectContent>
					</Select>

					<Select v-model="dateRange">
						<SelectTrigger class="w-[150px] h-9 text-sm">
							<SelectValue placeholder="Period" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1h" class="text-sm font-normal"
								>Last hour</SelectItem
							>
							<SelectItem value="24h" class="text-sm font-normal"
								>Last 24 hours</SelectItem
							>
							<SelectItem value="7d" class="text-sm font-normal"
								>Last 7 days</SelectItem
							>
							<SelectItem value="30d" class="text-sm font-normal"
								>Last 30 days</SelectItem
							>
						</SelectContent>
					</Select>
				</div>

				<!-- Runs Table -->
				<Card class="py-0 pt-6 pb-6 rounded-xl border-border/50">
					<CardHeader>
						<div class="flex items-center justify-between">
							<div>
								<CardTitle
									class="text-xs font-medium tracking-wide uppercase text-muted-foreground"
									>Workflow Runs</CardTitle
								>
								<CardDescription class="text-sm">
									{{ filteredRuns.length }} runs found
									<span v-if="selectedRuns.size > 0">
										· {{ selectedRuns.size }} selected
									</span>
								</CardDescription>
							</div>
							<Button
								variant="outline"
								size="sm"
								:disabled="selectedRuns.size === 0"
								class="flex items-center gap-2"
								@click="copyLogs"
							>
								<Check v-if="logsCopied" :size="16" class="text-green-500" />
								<Copy v-else :size="16" />
								{{ logsCopied ? "Copied" : "Copy Logs" }}
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead class="w-[40px]">
										<Checkbox
											:model-value="allSelected"
											@update:model-value="toggleAllRuns"
										/>
									</TableHead>
									<TableHead
										class="uppercase text-xs font-normal tracking-wider"
										>Run ID</TableHead
									>
									<TableHead
										class="uppercase text-xs font-normal tracking-wider"
										>Workflow</TableHead
									>
									<TableHead
										class="uppercase text-xs font-normal tracking-wider"
										>Trigger</TableHead
									>
									<TableHead
										class="w-[100px] uppercase text-xs font-normal tracking-wider"
										>Status</TableHead
									>
									<TableHead
										class="uppercase text-xs font-normal tracking-wider"
										>Progress</TableHead
									>
									<TableHead
										class="uppercase text-xs font-normal tracking-wider"
										>Started</TableHead
									>
									<TableHead
										class="w-[100px] uppercase text-xs font-normal tracking-wider"
										>Duration</TableHead
									>
								</TableRow>
							</TableHeader>
							<TableBody>
								<ContextMenu v-for="run in filteredRuns" :key="run.id">
									<ContextMenuTrigger as-child>
										<TableRow
											class="cursor-pointer"
											@click="toggleRunSelection(run.id)"
										>
											<TableCell @click.stop>
												<Checkbox
													:model-value="selectedRuns.has(run.id)"
													@update:model-value="toggleRunSelection(run.id)"
												/>
											</TableCell>
											<TableCell>
												<code class="font-mono text-xs text-foreground">
													{{ run.id.slice(0, 8) }}...
												</code>
											</TableCell>
											<TableCell>
												<span class="text-sm text-muted-foreground">
													{{ run.workflowName }}
												</span>
											</TableCell>
											<TableCell>
												<Badge variant="outline" class="capitalize">
													{{ run.triggeredBy }}
												</Badge>
											</TableCell>
											<TableCell>
												<div class="flex items-center gap-2">
													<component
														:is="getStatusIcon(run.status).icon"
														:size="14"
														:class="getStatusIcon(run.status).class"
													/>
													<span class="text-xs text-foreground capitalize">
														{{ run.status }}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<div class="flex items-center gap-2">
													<div
														class="w-16 h-1.5 bg-muted rounded-full overflow-hidden"
													>
														<div
															class="h-full bg-primary rounded-full transition-all"
															:style="{ width: `${getProgressPercent(run)}%` }"
														/>
													</div>
													<span class="text-xs text-muted-foreground">
														{{ run.documentsProcessed }}/{{
															run.documentsTotal
														}}
													</span>
												</div>
											</TableCell>
											<TableCell class="text-xs text-muted-foreground">
												{{ formatRelativeTime(run.startedAt, t) }}
											</TableCell>
											<TableCell class="text-xs text-muted-foreground">
												{{ formatDuration(run.startedAt, run.completedAt) }}
											</TableCell>
										</TableRow>
									</ContextMenuTrigger>
									<ContextMenuContent>
										<ContextMenuItem
											class="cursor-pointer"
											@click="viewRunDetails(run)"
										>
											<Eye :size="14" class="mr-2" />
											View Details
										</ContextMenuItem>
										<ContextMenuItem
											class="cursor-pointer"
											@click="copyRunDetails(run)"
										>
											<Copy :size="14" class="mr-2" />
											Copy Logs
										</ContextMenuItem>
									</ContextMenuContent>
								</ContextMenu>
							</TableBody>
						</Table>

						<div
							v-if="filteredRuns.length === 0"
							class="py-12 text-center text-sm text-muted-foreground"
						>
							No runs found
						</div>
					</CardContent>
				</Card>
			</template>
		</div>
	</div>
</template>
