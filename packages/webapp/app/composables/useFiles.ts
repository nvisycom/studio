import { useQuery, useMutation } from "@pinia/colada";
import type { File as NvisyFile, UpdateFile } from "@nvisy/sdk/datatypes";

/**
 * Composable for file operations
 */
export function useFiles(workspaceId?: MaybeRef<string | null>) {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceId } = useWorkspaces();

	const effectiveWorkspaceId = computed(
		() => (workspaceId ? toValue(workspaceId) : currentWorkspaceId.value) || "",
	);

	const filesQuery = useQuery({
		key: () => ["files", effectiveWorkspaceId.value],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.files.listFiles(effectiveWorkspaceId.value);
		},
		enabled: () => !!effectiveWorkspaceId.value && !!authToken.value?.apiToken,
	});

	const updateFileMutation = useMutation({
		mutation: async ({
			fileId,
			updates,
		}: {
			fileId: string;
			updates: UpdateFile;
		}) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.files.updateFile(fileId, updates);
		},
		onSuccess() {
			filesQuery.refresh();
		},
	});

	const deleteFileMutation = useMutation({
		mutation: async (fileId: string) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			await client.files.deleteFile(fileId);
		},
		onSuccess() {
			filesQuery.refresh();
		},
	});

	const uploadFilesMutation = useMutation({
		mutation: async (files: File[]) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			const wId = effectiveWorkspaceId.value;
			if (!wId) throw new Error("No workspace selected");
			return await client.files.uploadFiles(wId, files);
		},
		onSuccess() {
			filesQuery.refresh();
		},
	});

	async function downloadFile(fileId: string, fileName: string) {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		const response = await client.files.downloadFile(fileId);
		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = fileName;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function downloadMultiple(fileIds: string[], format: "zip" | "tar") {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		const wId = effectiveWorkspaceId.value;
		if (!wId) throw new Error("No workspace selected");
		const response = await client.files.downloadFilesArchive(wId, {
			fileIds,
			format,
		});
		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `files.${format}`;
		a.click();
		URL.revokeObjectURL(url);
	}

	return {
		// Query state
		files: filesQuery.data,
		isLoading: filesQuery.isLoading,
		error: filesQuery.error,
		refresh: filesQuery.refresh,

		// Mutations
		updateFile: updateFileMutation.mutate,
		updateFileAsync: updateFileMutation.mutateAsync,
		isUpdating: updateFileMutation.isLoading,
		updateError: updateFileMutation.error,

		deleteFile: deleteFileMutation.mutate,
		deleteFileAsync: deleteFileMutation.mutateAsync,
		isDeleting: deleteFileMutation.isLoading,
		deleteError: deleteFileMutation.error,

		uploadFiles: uploadFilesMutation.mutate,
		uploadFilesAsync: uploadFilesMutation.mutateAsync,
		isUploading: uploadFilesMutation.isLoading,
		uploadError: uploadFilesMutation.error,

		// Actions
		downloadFile,
		downloadMultiple,
	};
}
