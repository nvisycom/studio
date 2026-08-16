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
	docxParts?: MaybeRefOrGetter<Map<string, Uint8Array> | null>,
) {
	const { t } = useI18n();
	const { pipelines } = usePipelines();
	const { runDetection, findLatestRunForFile, getDetections } = useRuns();

	const selectedPipeline = ref<string>("");
	// Default to the first pipeline once they load. On file open, this is then
	// overridden with the file's latest-run pipeline when it has one (see below).
	watch(pipelines, (list) => {
		if (!selectedPipeline.value && list?.length) {
			selectedPipeline.value = list[0]!.slug;
		}
	});

	const phase = ref<StudioAuditPhase>("idle");
	// Restore token: bumped whenever a restore starts so an in-flight restore can
	// tell it has been superseded (file or pipeline changed) and bail.
	let restoreToken = 0;
	// True when the shown audit came from a prior run (restored on file open)
	// rather than a run started in this session.
	const restored = ref(false);
	const runStatus = ref<PipelineRun["status"] | null>(null);
	const audit = ref<Audit | null>(null);
	const errorMessage = ref("");

	const { entities, categorizedGroups, count } = useTextEntities(
		audit,
		documentText,
		docxParts,
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
		++restoreToken; // supersede any in-flight restore so it can't clobber this
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

	// True while a file-open is adopting that file's latest-run pipeline, so the
	// pipeline watcher below doesn't also fire a (duplicate) restore for it.
	let adoptingPipeline = false;

	// Restore the most recent run for a file — its detections still live on the
	// server even if the tab was closed. When `pipelineSlug` is given, restore
	// that pipeline's latest run; otherwise the file's latest run of any pipeline,
	// adopting its pipeline into the picker (`adopt`). Best-effort: falls back to
	// idle when nothing is found or the request is superseded.
	async function restoreLatest(
		file: string,
		opts: { pipelineSlug?: string; adopt?: boolean } = {},
	) {
		const token = ++restoreToken;
		phase.value = "restoring";
		runStatus.value = null;
		restored.value = false;
		errorMessage.value = "";
		audit.value = null;
		try {
			const latest = await findLatestRunForFile(file, opts.pipelineSlug);
			// Bail if a newer restore started (file or pipeline changed) meanwhile.
			if (token !== restoreToken) return;
			if (!latest) {
				phase.value = "idle";
				return;
			}
			// Adopt the run's pipeline into the picker without re-triggering a restore.
			if (
				opts.adopt &&
				latest.pipelineSlug !== selectedPipeline.value &&
				pipelines.value?.some((p) => p.slug === latest.pipelineSlug)
			) {
				adoptingPipeline = true;
				selectedPipeline.value = latest.pipelineSlug;
				adoptingPipeline = false;
			}
			const restoredAudit = await getDetections(latest.id);
			if (token !== restoreToken) return;
			audit.value = restoredAudit;
			runStatus.value = latest.status;
			restored.value = true;
			phase.value = "analyzed";
		} catch {
			if (token === restoreToken) phase.value = "idle";
		}
	}

	// On file open, restore the file's most recent run and adopt its pipeline, so
	// opening a file shows its latest audit under the pipeline that produced it.
	watch(
		() => toValue(fileId),
		(file) => {
			if (!file) {
				++restoreToken; // supersede any in-flight restore
				phase.value = "idle";
				runStatus.value = null;
				restored.value = false;
				errorMessage.value = "";
				audit.value = null;
				return;
			}
			restoreLatest(file, { adopt: true });
		},
		{ immediate: true },
	);

	// When the user switches the pipeline, restore that pipeline's latest audit
	// for the current file. Skipped while a file-open adopts its own pipeline
	// (that flow restores directly, above).
	watch(selectedPipeline, (pipeline) => {
		if (adoptingPipeline) return;
		const file = toValue(fileId);
		if (file && pipeline) restoreLatest(file, { pipelineSlug: pipeline });
	});

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
