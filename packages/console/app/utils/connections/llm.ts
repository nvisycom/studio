import type { LlmConfig } from "@nvisy/sdk/datatypes";

/** LLM provider tags (openai / anthropic / ollama), derived from the SDK. */
export type LlmProvider = LlmConfig["provider"];

/**
 * LLM connect-dialog metadata per provider. `needsApiKey` gates the API-key
 * field (Ollama is a local server, no key); `baseUrlRequired` reflects the SDK
 * (`ollama.baseUrl` is required, the hosted providers' is an optional override).
 */
export interface LlmProviderMeta {
	/** Product name shown as the card/dialog title (e.g. "ChatGPT"). */
	product: string;
	/** Company shown as the subtitle (e.g. "OpenAI"). */
	company: string;
	icon: string | null;
	needsApiKey: boolean;
	baseUrlRequired: boolean;
}

export const LLM_PROVIDERS: Record<LlmProvider, LlmProviderMeta> = {
	openai: {
		product: "ChatGPT",
		company: "OpenAI",
		icon: "/integration/openai.svg",
		needsApiKey: true,
		baseUrlRequired: false,
	},
	anthropic: {
		product: "Claude",
		company: "Anthropic",
		icon: "/integration/anthropic.svg",
		needsApiKey: true,
		baseUrlRequired: false,
	},
	ollama: {
		product: "Ollama",
		company: "Ollama",
		icon: "/integration/ollama.svg",
		needsApiKey: false,
		baseUrlRequired: true,
	},
};

/**
 * Maps an explore-page card id to the LLM provider it creates a connection for.
 */
export const PROVIDER_CARD_TO_LLM: Record<string, LlmProvider> = {
	chatgpt: "openai",
	claude: "anthropic",
	ollama: "ollama",
};

/** The SDK LLM provider for a card id, or null if it is not an LLM card. */
export function llmProviderForCard(cardId: string): LlmProvider | null {
	return PROVIDER_CARD_TO_LLM[cardId] ?? null;
}
