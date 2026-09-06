import type {
	CreateConnection,
	StartFileServiceOAuth,
} from "@nvisy/sdk/datatypes";
import type {
	FileProvider,
	LlmProvider,
	StorageProvider,
} from "#console/utils/connections";
import {
	PROVIDERS,
	fileServiceForCard,
	llmProviderForCard,
	storageProviderForCard,
} from "#console/utils/connections";
import { toast } from "vue-sonner";

/**
 * The explore page's connect flow: routes a card's Connect click to the right
 * dialog and runs each connect path.
 *
 * Three connectable families connect three different ways:
 *  - object stores (S3, Azure, GCS): a credential dialog -> `createConnection`.
 *  - LLMs (OpenAI, Anthropic, Ollama): a different credential dialog -> same.
 *  - cloud file services (Drive, Dropbox, OneDrive, Box): OAuth - a short dialog
 *    collects a name/folder, then we redirect to the provider's consent screen.
 *
 * A card id maps to exactly one family via the utils mappers; anything unmapped
 * is not connectable and the click is a no-op.
 */
export function useConnectProvider() {
	const { t } = useI18n();
	const { wLink } = useWorkspaceLink();
	const {
		createConnectionAsync,
		isCreating,
		startFileServiceOAuthAsync,
		isStartingOAuth,
	} = useConnections();

	// Shared header for whichever dialog opens (name + icon of the clicked card).
	const seed = ref({ name: "", icon: "" });

	const storageOpen = ref(false);
	const storageProvider = ref<StorageProvider | null>(null);

	const llmOpen = ref(false);
	const llmProvider = ref<LlmProvider | null>(null);

	const fileServiceOpen = ref(false);
	const fileServiceProvider = ref<FileProvider | null>(null);

	function connect(id: string | number) {
		const cardId = String(id);
		const card = PROVIDERS.find((p) => p.id === cardId);
		seed.value = { name: card ? t(card.nameKey) : "", icon: card?.icon ?? "" };

		const llm = llmProviderForCard(cardId);
		if (llm) {
			llmProvider.value = llm;
			llmOpen.value = true;
			return;
		}

		const fileProvider = fileServiceForCard(cardId);
		if (fileProvider) {
			fileServiceProvider.value = fileProvider;
			fileServiceOpen.value = true;
			return;
		}

		const storage = storageProviderForCard(cardId);
		if (storage) {
			storageProvider.value = storage;
			storageOpen.value = true;
		}
	}

	// Storage + LLM: create the connection from the dialog's payload.
	async function submitCredentials(connection: CreateConnection) {
		try {
			await createConnectionAsync(connection);
			storageOpen.value = false;
			llmOpen.value = false;
			toast.success(t("connections.dialogs.connect.success"));
			await navigateTo(wLink("/integrations"));
		} catch {
			toast.error(t("connections.dialogs.connect.error"));
		}
	}

	// File service: ask the server for the authorize URL and hand the browser to
	// the consent screen. The connection is created by the server-side callback
	// once the user grants access, which then redirects back to /integrations
	// (see the return handler there). A full navigation, not router.push:
	// authorizeUrl is the provider's own domain, outside the app.
	async function submitOAuth(request: StartFileServiceOAuth) {
		const provider = fileServiceProvider.value;
		if (!provider) return;
		try {
			const { authorizeUrl } = await startFileServiceOAuthAsync({
				provider,
				request,
			});
			window.location.href = authorizeUrl;
		} catch {
			toast.error(t("connections.dialogs.connect.error"));
		}
	}

	return {
		connect,
		seed,
		// Storage dialog
		storageOpen,
		storageProvider,
		// LLM dialog
		llmOpen,
		llmProvider,
		// File-service dialog
		fileServiceOpen,
		fileServiceProvider,
		// Submits + loading
		submitCredentials,
		submitOAuth,
		isCreating,
		isStartingOAuth,
	};
}
