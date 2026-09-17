/**
 * The workspace assistant chat — currently an inert stub.
 *
 * The SDK exposes no assistant chat API yet, so this preserves the composable's
 * public shape while doing nothing: the chat panel renders empty and its actions
 * are no-ops. Wire it to the real endpoint (messages + an SSE stream) once that
 * lands upstream.
 */

// A message as the panel renders it (kept so consumers' types resolve).
export interface ChatMessageView {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: string;
	parentId?: string;
	streaming?: boolean;
}

const sessions = ref<{ id: string; displayName?: string }[]>([]);
const currentSessionId = ref<string | null>(null);
const messages = ref<ChatMessageView[]>([]);

export function useChat() {
	const currentSession = computed<{ id: string; displayName?: string } | null>(
		() => null,
	);

	// No-op actions: the assistant is unavailable until the threads rework lands.
	async function loadSessions() {}
	async function selectSession(_sessionId: string) {}
	function newSession() {}
	async function deleteSession(_sessionId: string) {}
	async function sendMessage(_content: string) {}

	return {
		sessions: readonly(sessions),
		currentSession,
		currentSessionId: readonly(currentSessionId),
		messages: readonly(messages),
		isLoadingSessions: readonly(ref(false)),
		isLoadingMessages: readonly(ref(false)),
		isStreaming: readonly(ref(false)),
		needsProvider: readonly(ref(false)),
		error: readonly(ref<string | null>(null)),
		// While stubbed, the panel can show an "assistant unavailable" note.
		unavailable: readonly(ref(true)),
		loadSessions,
		selectSession,
		newSession,
		deleteSession,
		sendMessage,
	};
}
