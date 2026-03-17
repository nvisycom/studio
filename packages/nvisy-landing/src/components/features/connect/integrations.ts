import type { FunctionalComponent } from "vue";
import { Cloud, Cpu, Send } from "lucide-vue-next";

export interface IntegrationStep {
	id: number;
	icon: FunctionalComponent;
	text: string;
	service: string;
	badgeColor: string;
	status: "pending" | "loading" | "completed";
	duration: string;
	dataSize: string;
	timestamp: string;
}

export const integrationSteps: Omit<IntegrationStep, "status" | "timestamp">[] =
	[
		{
			id: 1,
			icon: Cloud,
			text: "Sync documents",
			service: "Google Drive",
			badgeColor:
				"bg-neutral-100 text-neutral-900 dark:bg-black dark:text-white border-neutral-300 dark:border-neutral-700",
			duration: "1.2s",
			dataSize: "2.4 MB",
		},
		{
			id: 2,
			icon: Cpu,
			text: "Redact data",
			service: "Nvisy",
			badgeColor:
				"bg-neutral-100 text-neutral-900 dark:bg-black dark:text-white border-neutral-300 dark:border-neutral-700",
			duration: "3.8s",
			dataSize: "23 entities",
		},
		{
			id: 3,
			icon: Send,
			text: "Send notification",
			service: "Slack",
			badgeColor:
				"bg-neutral-100 text-neutral-900 dark:bg-black dark:text-white border-neutral-300 dark:border-neutral-700",
			duration: "0.4s",
			dataSize: "webhook",
		},
	];
