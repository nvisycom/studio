import type { MaybeRefOrGetter } from "vue";
import type { AudioTranscriptState } from "#console/components/pages/studio/preview/AudioView.vue";
import type { StudioDetectionPhase } from "#console/composables/studio/useStudioDetection";

/**
 * Resolves the audio preview's transcript from a completed detection's
 * enrichment intermediates (fetched once the detection is `complete` for an audio
 * file). The transcript is optional by nature — the endpoint 404s to a null set
 * when none was produced — so a missing or empty transcript is a state the panel
 * explains, never an error:
 *
 * - `hidden`      — no completed detection for an audio file yet.
 * - `unavailable` — no intermediates (404 / null), or a 200 without an audio
 *                   artifact: the transcript was never generated or is gone.
 * - `empty`       — a transcript exists but has no speech segments.
 * - `ready`       — the transcript, with segments.
 *
 * Guards against a stale response: the detection can change while the fetch is in
 * flight, so a result applies only while its id is still active.
 */
export function useAudioTranscript(args: {
	detectionId: MaybeRefOrGetter<string | null>;
	phase: MaybeRefOrGetter<StudioDetectionPhase>;
	isAudio: MaybeRefOrGetter<boolean>;
}) {
	const { getIntermediates } = useDetections();
	const state = ref<AudioTranscriptState>({ kind: "hidden" });

	watch(
		[
			() => toValue(args.detectionId),
			() => toValue(args.phase),
			() => toValue(args.isAudio),
		],
		async ([detectionId, phase, isAudio]) => {
			state.value = { kind: "hidden" };
			if (!detectionId || phase !== "complete" || !isAudio) return;
			try {
				const set = await getIntermediates(detectionId);
				if (toValue(args.detectionId) !== detectionId) return;
				const body = soleArtifactPart(set);
				if (body?.modality !== "audio") {
					state.value = { kind: "unavailable" };
					return;
				}
				const hasSpeech = body.artifact.segments.some(
					(s) => s.text.trim().length > 0,
				);
				state.value = hasSpeech
					? { kind: "ready", transcript: body.artifact }
					: { kind: "empty" };
			} catch {
				// A real error (not a 404 — that's mapped to null): treat as
				// unavailable rather than surfacing a failure for an optional
				// enhancement.
				if (toValue(args.detectionId) === detectionId)
					state.value = { kind: "unavailable" };
			}
		},
		{ immediate: true },
	);

	return state;
}
