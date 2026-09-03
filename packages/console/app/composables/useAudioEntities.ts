import type { Audit } from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";
import {
	type BaseEntityView,
	type CategorizedGroup as CategorizedGroupBase,
	categorize,
	provenance,
} from "#console/composables/useEntities";

/**
 * A detected audio entity, for the waveform's timeline overlay + the audit list.
 * The modality-agnostic fields come from {@link BaseEntityView}; this adds the
 * *span* — the entity's time range in the audio stream, in seconds.
 *
 * Like image entities, an audio entity's location is the recognizer's own
 * (`entity.location.span`), not derived from the transcript.
 */
export interface AudioEntityView extends BaseEntityView {
	modality: "audio";
	/** Time span in seconds from the stream start. */
	span: AudioSpan;
	/** Diarization speaker label, when the backend assigned one. */
	speaker?: string;
}

/** A time span in seconds from the stream start. */
export interface AudioSpan {
	start: number;
	end: number;
}

/** The category-grouped audit sections for audio entities. */
export type AudioCategorizedGroup = CategorizedGroupBase<AudioEntityView>;

/**
 * Flatten a detection's audit into audio entities with time spans — the shape the
 * waveform overlays and the audit list renders. Only the `audio` body modality
 * yields any; a non-audio (or absent) audit returns nothing. Spans come back in
 * microseconds and are converted to seconds here.
 */
export function useAudioEntities(audit: MaybeRefOrGetter<Audit | null>) {
	const { resolveLabel, labelName } = useLabels();

	const entities = computed<AudioEntityView[]>(() => {
		const body = soleReportPart(toValue(audit)?.report);
		if (body?.modality !== "audio") return [];
		return body.entities.map((e) => ({
			id: e.id,
			modality: "audio" as const,
			label: e.label,
			category: resolveLabel(e.label)?.category ?? null,
			confidence: e.confidence,
			span: {
				start: e.location.span.start_us / 1e6,
				end: e.location.span.end_us / 1e6,
			},
			...(e.location.speaker_id !== undefined
				? { speaker: e.location.speaker_id }
				: {}),
			...provenance(e),
		}));
	});

	const count = computed(() => entities.value.length);

	// Audio cluster key: distinct spans only break a tie when there's no value.
	const audioClusterKey = (item: AudioEntityView) => ({
		location: `${item.span.start},${item.span.end}`,
	});

	const categorizedGroups = computed<AudioCategorizedGroup[]>(() =>
		categorize(entities.value, labelName, audioClusterKey),
	);

	return { entities, categorizedGroups, count };
}
