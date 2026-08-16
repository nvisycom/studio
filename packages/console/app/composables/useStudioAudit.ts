import type { Audit, PipelineRun } from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";

/** Lifecycle phase of the studio's detection run. */
export type StudioAuditPhase =
	| "idle"
	| "restoring"
	| "running"
	| "analyzed"
	| "failed";

/**
 * Owns the studio's detection run + audit lifecycle for the active file: the
 * pipeline choice, running detection, restoring the file's most recent run, and
 * the flattened entities the document + audit panel render.
 *
 * Call this once per studio page and share its result — the run bar drives the
 * pipeline/run controls while the audit panel and document overlay read the
 * entities, so both must observe the same state.
 */
export function useStudioAudit(
	fileId: MaybeRefOrGetter<string | null>,
	documentText: MaybeRefOrGetter<string | null>,
) {
	const { t } = useI18n();
	const { pipelines } = usePipelines();
	const { runDetection, findLatestRunForFile, getDetections } = useRuns();

	const selectedPipeline = ref<string>("");
	// Default to the first pipeline once they load.
	watch(pipelines, (list) => {
		if (!selectedPipeline.value && list?.length) {
			selectedPipeline.value = list[0]!.slug;
		}
	});

	const phase = ref<StudioAuditPhase>("idle");
	// True when the shown audit came from a prior run (restored on file open)
	// rather than a run started in this session.
	const restored = ref(false);
	const runStatus = ref<PipelineRun["status"] | null>(null);
	const audit = ref<Audit | null>(null);
	const errorMessage = ref("");

	const { entities, categorizedGroups, count } = useTextEntities(
		audit,
		documentText,
	);

	const canRun = computed(
		() =>
			!!toValue(fileId) &&
			!!selectedPipeline.value &&
			phase.value !== "running" &&
			phase.value !== "restoring",
	);

	async function run() {
		const file = toValue(fileId);
		if (!file || !selectedPipeline.value) return;
		phase.value = "running";
		runStatus.value = "queued";
		restored.value = false;
		errorMessage.value = "";
		audit.value = null;
		try {
			const result = await runDetection(
				selectedPipeline.value,
				{ fileId: file },
				(status) => {
					runStatus.value = status;
				},
			);
			audit.value = result.audit;
			phase.value = "analyzed";
		} catch (err) {
			phase.value = "failed";
			errorMessage.value = getErrorMessage(err, t("studio.audit.runFailed"));
		}
	}

	// On file change, clear the old audit and try to restore the file's most recent
	// run — its detections still live on the server even if the tab was closed.
	watch(
		() => toValue(fileId),
		async (file) => {
			phase.value = "idle";
			runStatus.value = null;
			restored.value = false;
			errorMessage.value = "";
			audit.value = null;
			if (!file) return;

			phase.value = "restoring";
			try {
				const latest = await findLatestRunForFile(file);
				// Bail if the user switched files while this was in flight, or the run
				// state moved on (a fresh run may have started here meanwhile).
				if (toValue(fileId) !== file || phase.value !== "restoring") return;
				if (!latest) {
					phase.value = "idle";
					return;
				}
				const restoredAudit = await getDetections(latest.id);
				if (toValue(fileId) !== file || phase.value !== "restoring") return;
				audit.value = restoredAudit;
				runStatus.value = latest.status;
				restored.value = true;
				phase.value = "analyzed";
				if (pipelines.value?.some((p) => p.slug === latest.pipelineSlug)) {
					selectedPipeline.value = latest.pipelineSlug;
				}
			} catch {
				// Restore is best-effort; fall back to the idle state.
				if (toValue(fileId) === file && phase.value === "restoring") {
					phase.value = "idle";
				}
			}
		},
		{ immediate: true },
	);

	return {
		pipelines,
		selectedPipeline,
		phase,
		restored,
		runStatus,
		audit,
		errorMessage,
		entities,
		categorizedGroups,
		count,
		canRun,
		run,
	};
}
