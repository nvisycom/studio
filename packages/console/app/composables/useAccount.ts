import type { SetPassword, UpdateAccount } from "@nvisy/sdk/datatypes";

/**
 * Composable for account operations
 */
export function useAccount() {
	const { $nvisyClient } = useNuxtApp();
	const { isAuthenticated } = useAuth();

	const accountQuery = useQuery({
		key: () => ["account"],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.account.getAccount();
		},
		enabled: () => isAuthenticated.value,
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

	// Set (or change) the account password. Changing an existing password passes
	// `currentPassword`; setting a first password (for an OIDC-only account) omits
	// it and carries a `reauthProof` from an OIDC step-up instead.
	const setPasswordMutation = useMutation({
		mutation: async (request: SetPassword) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.account.setPassword(request);
		},
		onSuccess() {
			accountQuery.refresh();
		},
	});

	// Remove the account password, leaving OIDC providers as the sign-in methods.
	// The server refuses if it's the account's only method.
	const removePasswordMutation = useMutation({
		mutation: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.account.removePassword();
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

		// Password
		setPasswordAsync: setPasswordMutation.mutateAsync,
		isSettingPassword: setPasswordMutation.isLoading,
		removePasswordAsync: removePasswordMutation.mutateAsync,
		isRemovingPassword: removePasswordMutation.isLoading,

		// Avatar
		uploadAvatarAsync: uploadAvatarMutation.mutateAsync,
		isUploadingAvatar: uploadAvatarMutation.isLoading,
		deleteAvatarAsync: deleteAvatarMutation.mutateAsync,
		isDeletingAvatar: deleteAvatarMutation.isLoading,
	};
}
