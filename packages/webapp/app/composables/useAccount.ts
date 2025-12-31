import { useQuery, useMutation } from "@pinia/colada";
import type { Account, UpdateAccount } from "@nvisy/sdk";

/**
 * Composable for account operations
 */
export function useAccount() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();

	const accountQuery = useQuery({
		key: () => ["account"],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.account.get();
		},
		enabled: () => !!authToken.value?.apiToken,
	});

	const updateAccountMutation = useMutation({
		mutation: async (updates: UpdateAccount) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.account.update(updates);
		},
		onSuccess() {
			accountQuery.refresh();
		},
	});

	return {
		// Query state
		account: accountQuery.data,
		isLoading: accountQuery.isLoading,
		error: accountQuery.error,
		refresh: accountQuery.refresh,

		// Update account
		updateAccount: updateAccountMutation.mutate,
		updateAccountAsync: updateAccountMutation.mutateAsync,
		isUpdating: updateAccountMutation.isLoading,
		updateError: updateAccountMutation.error,
	};
}
