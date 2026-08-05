import type { UpdateAccount } from "@nvisy/sdk/datatypes";

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
			return await client.account.getAccount();
		},
		enabled: () => !!authToken.value?.apiToken,
	});

	const updateAccountMutation = useMutation({
		mutation: async (updates: UpdateAccount) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.account.updateAccount(updates);
		},
		onSuccess() {
			accountQuery.refresh();
		},
	});

	const uploadAvatarMutation = useMutation({
		mutation: async (avatar: Blob) => {
			const client = $nvisyClient.value;
			const name = accountQuery.data.value?.username;
			if (!client || !name) throw new Error("Not authenticated");
			return await client.account.uploadAvatar(name, avatar);
		},
		onSuccess() {
			accountQuery.refresh();
		},
	});

	const deleteAvatarMutation = useMutation({
		mutation: async () => {
			const client = $nvisyClient.value;
			const name = accountQuery.data.value?.username;
			if (!client || !name) throw new Error("Not authenticated");
			return await client.account.deleteAvatar(name);
		},
		onSuccess() {
			accountQuery.refresh();
		},
	});

	// Computed helpers for account data
	const displayName = computed(() => accountQuery.data.value?.displayName);
	const username = computed(() => accountQuery.data.value?.username);
	const emailAddress = computed(() => accountQuery.data.value?.emailAddress);
	const avatarUrl = computed(() => accountQuery.data.value?.avatarUrl);
	const firstName = computed(() => displayName.value?.split(" ")[0] || "");

	return {
		// Query state
		account: accountQuery.data,
		isLoading: accountQuery.isLoading,
		error: accountQuery.error,
		refresh: accountQuery.refresh,

		// Computed helpers
		displayName,
		username,
		emailAddress,
		avatarUrl,
		firstName,

		// Update account
		updateAccount: updateAccountMutation.mutate,
		updateAccountAsync: updateAccountMutation.mutateAsync,
		isUpdating: updateAccountMutation.isLoading,
		updateError: updateAccountMutation.error,

		// Avatar
		uploadAvatarAsync: uploadAvatarMutation.mutateAsync,
		isUploadingAvatar: uploadAvatarMutation.isLoading,
		deleteAvatarAsync: deleteAvatarMutation.mutateAsync,
		isDeletingAvatar: deleteAvatarMutation.isLoading,
	};
}
