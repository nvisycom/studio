import type { Ref } from "vue";
import { NvisyApiError } from "@nvisy/sdk";
import type { ChatMessage, ChatSession } from "@nvisy/sdk/datatypes";

/**
 * The workspace assistant chat, backed by the SDK's `client.chat.*` sessions and
 * Server-Sent-Events message stream.
 *
 * State is a module-level singleton: there's one chat panel in the shell, so
 * every trigger (the header toggle, the studio, a future launcher) drives the
 * same sessions, current session, and message list. The assistant's reply
 * streams token-by-token into the last message, which grows reactively as
 * `ChatToken` deltas arrive.
 *
 * A workspace with no inference provider configured returns 409 on send; that's
 * surfaced as `needsProvider` so the panel can prompt the user to connect one
 * rather than showing an error.
 */

// A message as the panel renders it: the SDK's fields plus the transient
// `streaming` flag on the assistant reply currently being received.
export interface ChatMessageView {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: string;
	parentId?: string;
	streaming?: boolean;
}

const sessions = ref<ChatSession[]>([]);
const currentSessionId = ref<string | null>(null);
const messages = ref<ChatMessageView[]>([]);
const isLoadingSessions = ref(false);
const isLoadingMessages = ref(false);
const isStreaming = ref(false);
// Set when a send returns 409 — the workspace has no inference provider, so the
// assistant can't reply until one is connected.
const needsProvider = ref(false);
const error = ref<string | null>(null);
let loadedWorkspace: string | null = null;

// Reset all chat state when the workspace changes, so one workspace's
// conversations never bleed into another's. Registered once in a DETACHED effect
// scope (not the calling component's), so it lives for the app's lifetime rather
// than dying when the first `useChat` consumer unmounts.
let resetWatchBound = false;
function bindWorkspaceReset(
	currentWorkspaceSlug: Ref<string | null | undefined>,
) {
	if (resetWatchBound) return;
	resetWatchBound = true;
	effectScope(true).run(() => {
		watch(currentWorkspaceSlug, () => {
			loadedWorkspace = null;
			sessions.value = [];
			currentSessionId.value = null;
			messages.value = [];
			error.value = null;
			needsProvider.value = false;
		});
	});
}

/** Convert an SDK message into the view model. */
function toView(message: ChatMessage): ChatMessageView {
	return {
		id: message.id,
		role: message.role === "system" ? "assistant" : message.role,
		content: message.content,
		createdAt: message.createdAt,
		parentId: message.parentId,
	};
}

export function useChat() {
	const { $nvisyClient } = useNuxtApp();
	const { currentWorkspaceSlug } = useWorkspaces();
	bindWorkspaceReset(currentWorkspaceSlug);

	function requireClient() {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		return client;
	}

	function requireWorkspace(): string {
		const slug = currentWorkspaceSlug.value;
		if (!slug) throw new Error("No active workspace");
		return slug;
	}

	const currentSession = computed(
		() => sessions.value.find((s) => s.id === currentSessionId.value) ?? null,
	);

	// The leaf to branch new messages from: the active session's current message,
	// else the last message we have loaded.
	const currentLeafId = computed(
		() => currentSession.value?.currentMessageId ?? messages.value.at(-1)?.id,
	);

	// Load the workspace's sessions once per workspace (a switch reloads). Selects
	// the most recently active session so the panel opens on a conversation.
	async function loadSessions() {
		const slug = requireWorkspace();
		if (loadedWorkspace === slug) return;
		loadedWorkspace = slug;
		isLoadingSessions.value = true;
		error.value = null;
		try {
			const page = await requireClient().chat.listSessions(slug);
			sessions.value = page.items;
			if (page.items[0]) await selectSession(page.items[0].id);
		} catch {
			// A load failure leaves the panel empty; the next open retries.
			loadedWorkspace = null;
		} finally {
			isLoadingSessions.value = false;
		}
	}

	// Switch to a session and load its message history in chronological order.
	async function selectSession(sessionId: string) {
		currentSessionId.value = sessionId;
		messages.value = [];
		isLoadingMessages.value = true;
		try {
			const history = await requireClient().chat.listMessages(
				requireWorkspace(),
				sessionId,
			);
			messages.value = history.map(toView);
		} catch {
			messages.value = [];
		} finally {
			isLoadingMessages.value = false;
		}
	}

	// Start a fresh conversation: clears the current session so the next send
	// creates one (titled from its first message).
	function newSession() {
		currentSessionId.value = null;
		messages.value = [];
		error.value = null;
		needsProvider.value = false;
	}

	async function deleteSession(sessionId: string) {
		await requireClient().chat.deleteSession(requireWorkspace(), sessionId);
		sessions.value = sessions.value.filter((s) => s.id !== sessionId);
		if (currentSessionId.value === sessionId) newSession();
	}

	/**
	 * Send a message and stream the assistant's reply. Creates a session first
	 * when there isn't one, appends the user message and a live assistant message,
	 * then grows the assistant message as `ChatToken` deltas arrive.
	 */
	async function sendMessage(content: string) {
		const text = content.trim();
		if (!text || isStreaming.value) return;

		const slug = requireWorkspace();
		error.value = null;
		needsProvider.value = false;

		// Ensure a session exists (seed its title from the first message).
		if (!currentSessionId.value) {
			try {
				const session = await requireClient().chat.createSession(slug, {
					title: text.slice(0, 80),
				});
				sessions.value = [session, ...sessions.value];
				currentSessionId.value = session.id;
			} catch {
				error.value = "send";
				return;
			}
		}
		const sessionId = currentSessionId.value;
		if (!sessionId) return;

		const parentId = currentLeafId.value;
		const now = new Date().toISOString();
		messages.value.push({
			id: `local-user-${crypto.randomUUID()}`,
			role: "user",
			content: text,
			createdAt: now,
			parentId,
		});
		const assistant = reactive<ChatMessageView>({
			id: `local-assistant-${crypto.randomUUID()}`,
			role: "assistant",
			content: "",
			createdAt: new Date().toISOString(),
			streaming: true,
		});
		messages.value.push(assistant);

		isStreaming.value = true;
		try {
			for await (const token of requireClient().chat.streamMessage(
				slug,
				sessionId,
				{ content: text, ...(parentId ? { parentId } : {}) },
			)) {
				assistant.content += token.delta;
			}
		} catch (err) {
			// 409: the workspace has no inference provider configured.
			if (err instanceof NvisyApiError && err.statusCode === 409) {
				needsProvider.value = true;
			} else {
				error.value = "stream";
			}
			// Drop the empty/partial assistant bubble on failure.
			if (!assistant.content) {
				messages.value = messages.value.filter((m) => m.id !== assistant.id);
			}
		} finally {
			assistant.streaming = false;
			isStreaming.value = false;
			// Reconcile ids/tree with the server (the optimistic ids are local), and
			// refresh the session's updatedAt/currentMessageId for ordering.
			await reconcile(sessionId);
		}
	}

	// Re-fetch the session's messages and list so local optimistic ids are
	// replaced by the server's, keeping the message tree consistent.
	async function reconcile(sessionId: string) {
		try {
			const [history, page] = await Promise.all([
				requireClient().chat.listMessages(requireWorkspace(), sessionId),
				requireClient().chat.listSessions(requireWorkspace()),
			]);
			if (currentSessionId.value === sessionId) {
				messages.value = history.map(toView);
			}
			sessions.value = page.items;
		} catch {
			// Best-effort; the optimistic view still reflects the conversation.
		}
	}

	return {
		sessions: readonly(sessions),
		currentSession,
		currentSessionId: readonly(currentSessionId),
		messages: readonly(messages),
		isLoadingSessions: readonly(isLoadingSessions),
		isLoadingMessages: readonly(isLoadingMessages),
		isStreaming: readonly(isStreaming),
		needsProvider: readonly(needsProvider),
		error: readonly(error),
		loadSessions,
		selectSession,
		newSession,
		deleteSession,
		sendMessage,
	};
}
