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
				"bg-gray-100 text-gray-900 dark:bg-black dark:text-white border-gray-300 dark:border-neutral-700",
			duration: "1.2s",
			dataSize: "2.4 MB",
		},
		{
			id: 2,
			icon: Cpu,
			text: "Process redactions",
			service: "Nvisy Cloud",
			badgeColor:
				"bg-gray-100 text-gray-900 dark:bg-black dark:text-white border-gray-300 dark:border-neutral-700",
			duration: "3.8s",
			dataSize: "15 entities",
		},
		{
			id: 3,
			icon: Send,
			text: "Send notification",
			service: "Slack",
			badgeColor:
				"bg-gray-100 text-gray-900 dark:bg-black dark:text-white border-gray-300 dark:border-neutral-700",
			duration: "0.4s",
			dataSize: "webhook",
		},
	];
