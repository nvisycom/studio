import type {
	Webhook,
	WebhookEvent,
	WebhookStatus,
} from "@nvisy/sdk/datatypes";

/** All webhook event types the SDK supports, in display order. */
export const WEBHOOK_EVENTS: WebhookEvent[] = [
	"file.created",
	"file.updated",
	"file.deleted",
	"member.added",
	"member.updated",
	"member.deleted",
	"connection.created",
	"connection.updated",
	"connection.deleted",
	"connection.sync.started",
	"connection.sync.completed",
	"connection.sync.failed",
	"pipeline.created",
	"pipeline.updated",
	"pipeline.deleted",
	"pipeline.run.started",
	"pipeline.run.completed",
	"pipeline.run.failed",
	"policy.created",
	"policy.updated",
	"policy.deleted",
];

export interface WebhookHeader {
	/** Stable id so a row's input keeps focus/identity across splices. */
	id: number;
	key: string;
	value: string;
}

export interface WebhookFormPayload {
	displayName: string;
	url: string;
	status: WebhookStatus;
	events: WebhookEvent[];
	headers: Record<string, string>;
}

function isValidUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "https:" || parsed.protocol === "http:";
	} catch {
		return false;
	}
}

function emptyEvents(): Record<WebhookEvent, boolean> {
	return Object.fromEntries(WEBHOOK_EVENTS.map((e) => [e, false])) as Record<
		WebhookEvent,
		boolean
	>;
}

/**
 * Shared form state + validation for the create/edit webhook dialogs.
 */
export function useWebhookForm() {
	const name = ref("");
	const url = ref("");
	const active = ref(true);
	const events = ref<Record<WebhookEvent, boolean>>(emptyEvents());
	const headers = ref<WebhookHeader[]>([]);
	const urlError = ref("");

	// Stable ids so header row inputs keep their identity across splices; the id
	// travels on the row itself, not a parallel array that could desync.
	let nextHeaderId = 0;

	function addHeader() {
		headers.value.push({ id: nextHeaderId++, key: "", value: "" });
	}

	function removeHeader(index: number) {
		headers.value.splice(index, 1);
	}

	function validateUrl(t: (key: string) => string) {
		urlError.value =
			url.value.trim() && !isValidUrl(url.value)
				? t("connections.forms.webhook.urlError")
				: "";
	}

	const selectedEvents = computed(() =>
		WEBHOOK_EVENTS.filter((e) => events.value[e]),
	);

	const headersObject = computed(() => {
		const result: Record<string, string> = {};
		for (const header of headers.value) {
			if (header.key.trim()) result[header.key.trim()] = header.value;
		}
		return result;
	});

	const isFormValid = computed(
		() =>
			url.value.trim().length > 0 &&
			isValidUrl(url.value) &&
			name.value.trim().length > 0 &&
			selectedEvents.value.length > 0,
	);

	function reset() {
		name.value = "";
		url.value = "";
		active.value = true;
		events.value = emptyEvents();
		headers.value = [];
		urlError.value = "";
	}

	function populate(webhook: Webhook) {
		name.value = webhook.displayName;
		url.value = webhook.url;
		// "suspended" is a server-set failure state; treat anything not "enabled"
		// as off for the toggle.
		active.value = webhook.status === "enabled";

		events.value = emptyEvents();
		for (const event of webhook.events) {
			if (event in events.value) events.value[event as WebhookEvent] = true;
		}

		const entries =
			webhook.headers && typeof webhook.headers === "object"
				? Object.entries(webhook.headers as Record<string, string>)
				: [];
		headers.value = entries.map(([key, value]) => ({
			id: nextHeaderId++,
			key,
			value,
		}));
	}

	function payload(): WebhookFormPayload {
		return {
			displayName: name.value,
			url: url.value,
			status: active.value ? "enabled" : "disabled",
			events: selectedEvents.value,
			headers: headersObject.value,
		};
	}

	return {
		name,
		url,
		active,
		events,
		headers,
		urlError,
		addHeader,
		removeHeader,
		validateUrl,
		selectedEvents,
		headersObject,
		isFormValid,
		reset,
		populate,
		payload,
	};
}
