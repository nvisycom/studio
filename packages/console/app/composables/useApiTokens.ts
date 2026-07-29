import { useQuery, useMutation } from "@pinia/colada";
import type {
	ApiToken,
	CreateApiToken,
	UpdateApiToken,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for API token operations
 */
export function useApiTokens() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();

	const tokensQuery = useQuery({
		key: ["apiTokens"],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			const result = await client.apiTokens.listApiTokens();
			return result.items;
		},
		enabled: () => !!authToken.value?.apiToken,
	});

	const createTokenMutation = useMutation({
		mutation: async (token: CreateApiToken) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.apiTokens.createApiToken(token);
		},
		onSuccess() {
			tokensQuery.refresh();
		},
	});

	const updateTokenMutation = useMutation({
		mutation: async ({
			tokenId,
			updates,
		}: {
			tokenId: string;
			updates: UpdateApiToken;
		}) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.apiTokens.updateApiToken(tokenId, updates);
		},
		onSuccess() {
			tokensQuery.refresh();
		},
	});

	const revokeTokenMutation = useMutation({
		mutation: async (tokenId: string) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			await client.apiTokens.revokeApiToken(tokenId);
		},
		onSuccess() {
			tokensQuery.refresh();
		},
	});

	return {
		// Query state
		tokens: tokensQuery.data,
		isLoading: tokensQuery.isLoading,
		error: tokensQuery.error,
		refresh: tokensQuery.refresh,

		// Create
		createToken: createTokenMutation.mutate,
		createTokenAsync: createTokenMutation.mutateAsync,
		isCreating: createTokenMutation.isLoading,
		createError: createTokenMutation.error,

		// Update
		updateToken: updateTokenMutation.mutate,
		updateTokenAsync: updateTokenMutation.mutateAsync,
		isUpdating: updateTokenMutation.isLoading,
		updateError: updateTokenMutation.error,

		// Revoke
		revokeToken: revokeTokenMutation.mutate,
		revokeTokenAsync: revokeTokenMutation.mutateAsync,
		isRevoking: revokeTokenMutation.isLoading,
		revokeError: revokeTokenMutation.error,
	};
}
