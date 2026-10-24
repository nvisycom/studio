import type { MaybeRefOrGetter } from "vue";
import type { ImageLayout } from "#console/composables/studio/useImageLayout";
import type { StudioDetectionPhase } from "#console/composables/studio/useStudioDetection";

/**
 * Resolves the image preview's optional OCR overlay from a completed detection's
 * enrichment intermediates (the same endpoint the audio transcript uses), once
 * the detection is `complete` for an image file. Optional like the transcript:
 * null when there are no intermediates or no image artifact.
 *
 * Guards against a stale response: the detection can change while the fetch is in
 * flight, so a result applies only while its id is still active.
 */
export function useImageOcr(args: {
	detectionId: MaybeRefOrGetter<string | null>;
	phase: MaybeRefOrGetter<StudioDetectionPhase>;
	isImage: MaybeRefOrGetter<boolean>;
}) {
	const { getIntermediates } = useDetections();
	const ocr = ref<ImageLayout | null>(null);

	watch(
		[
			() => toValue(args.detectionId),
			() => toValue(args.phase),
			() => toValue(args.isImage),
		],
		async ([detectionId, phase, isImage]) => {
			ocr.value = null;
			if (!detectionId || phase !== "complete" || !isImage) return;
			try {
				const set = await getIntermediates(detectionId);
				if (toValue(args.detectionId) !== detectionId) return;
				const body = soleArtifactPart(set);
				ocr.value =
					body?.modality === "image" ? toImageLayout(body.artifact) : null;
			} catch {
				if (toValue(args.detectionId) === detectionId) ocr.value = null;
			}
		},
		{ immediate: true },
	);

	return ocr;
}
