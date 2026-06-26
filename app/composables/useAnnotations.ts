import { useQuery, useMutation } from "@pinia/colada";
import type {
	Annotation,
	CreateAnnotation,
	UpdateAnnotation,
	CursorPagination,
} from "@nvisy/sdk/datatypes";

export interface UseAnnotationsOptions {
	fileId: MaybeRef<string | null>;
	query?: MaybeRef<CursorPagination>;
}

/**
 * Composable for annotation operations on a file
 */
export function useAnnotations(options: UseAnnotationsOptions) {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();

	const effectiveFileId = computed(() => toValue(options.fileId) || "");

	const queryParams = computed<CursorPagination>(() => ({
		...toValue(options.query ?? {}),
	}));

	// List annotations for a file
	const annotationsQuery = useQuery({
		key: () => [
			"annotations",
			effectiveFileId.value,
			JSON.stringify(queryParams.value),
		],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			const result = await client.annotations.listAnnotations(
				effectiveFileId.value,
				queryParams.value,
			);
			return result.items;
		},
		enabled: () => !!effectiveFileId.value && !!authToken.value?.apiToken,
	});

	// Create annotation mutation
	const createAnnotationMutation = useMutation({
		mutation: async (annotation: CreateAnnotation) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.annotations.createAnnotation(
				effectiveFileId.value,
				annotation,
			);
		},
		onSuccess() {
			annotationsQuery.refetch();
		},
	});

	// Update annotation mutation
	const updateAnnotationMutation = useMutation({
		mutation: async ({
			annotationId,
			updates,
		}: {
			annotationId: string;
			updates: UpdateAnnotation;
		}) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.annotations.updateAnnotation(annotationId, updates);
		},
		onSuccess() {
			annotationsQuery.refetch();
		},
	});

	// Delete annotation mutation
	const deleteAnnotationMutation = useMutation({
		mutation: async (annotationId: string) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			await client.annotations.deleteAnnotation(annotationId);
		},
		onSuccess() {
			annotationsQuery.refetch();
		},
	});

	return {
		// Query state
		annotations: annotationsQuery.data,
		isLoading: annotationsQuery.isLoading,
		error: annotationsQuery.error,
		refresh: annotationsQuery.refetch,

		// Create
		createAnnotation: createAnnotationMutation.mutate,
		createAnnotationAsync: createAnnotationMutation.mutateAsync,
		isCreating: createAnnotationMutation.isLoading,
		createError: createAnnotationMutation.error,

		// Update
		updateAnnotation: updateAnnotationMutation.mutate,
		updateAnnotationAsync: updateAnnotationMutation.mutateAsync,
		isUpdating: updateAnnotationMutation.isLoading,
		updateError: updateAnnotationMutation.error,

		// Delete
		deleteAnnotation: deleteAnnotationMutation.mutate,
		deleteAnnotationAsync: deleteAnnotationMutation.mutateAsync,
		isDeleting: deleteAnnotationMutation.isLoading,
		deleteError: deleteAnnotationMutation.error,
	};
}
