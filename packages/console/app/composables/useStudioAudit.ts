import type { Audit, PipelineRun } from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";

/** Lifecycle phase of the studio's detection run. */
export type StudioAuditPhase =
	| "idle"
	| "restoring"
	| "running"
	| "analyzed"
	| "failed";

/** Lifecycle of applying redactions to an analyzed run. */
export type StudioRedactPhase = "idle" | "redacting" | "done" | "failed";

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
	const {
		runDetection,
		findLatestRunForFile,
		getDetections,
		redactRun,
		downloadOutput,
	} = useRuns();

	const selectedPipeline = ref<string>("");
	// The last value we set on `selectedPipeline` programmatically (default or
	// adoption). The pipeline watcher runs asynchronously — after the sync block
	// that set the value — so a boolean flag reset synchronously wouldn't span it.
	// Instead we record the value and have the watcher skip a restore when the new
	// selection equals it (i.e. it wasn't a user switch).
	let programmaticPipeline: string | null = null;

	// The pipeline of the file's most recent run, to adopt into the picker. Held
	// separately because the run can resolve before the pipeline list loads; once
	// the list is present, this wins over the "first pipeline" default so a
	// refresh restores the file's own pipeline rather than resetting to the first.
	const pendingAdoptPipeline = ref<string | null>(null);
	// Whether the file-open restore has decided on adoption yet. We hold off the
	// "first pipeline" default until it has, so the picker doesn't briefly show
	// the wrong pipeline and then flicker to the adopted one. With no file open,
	// there's nothing to adopt, so it's resolved immediately.
	const adoptResolved = ref(!toValue(fileId));

	// Pick the selected pipeline once the list loads (or the pending adoption
	// arrives): the file's latest-run pipeline when known and still valid, else —
	// only once adoption has resolved — the first pipeline. Only sets a default
	// when nothing is selected yet.
	watch(
		[pipelines, pendingAdoptPipeline, adoptResolved],
		([list, adopt, resolved]) => {
			if (!list?.length) return;
			const target =
				adopt && list.some((p) => p.slug === adopt)
					? adopt
					: resolved && !selectedPipeline.value
						? list[0]!.slug
						: null;
			if (target && target !== selectedPipeline.value) {
				// Mark as programmatic so the pipeline watcher doesn't treat it as a
				// user switch (which would start a competing/wrong restore).
				programmaticPipeline = target;
				selectedPipeline.value = target;
			}
		},
		{ immediate: true },
	);

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

	// The run backing the shown audit — the target for redaction. Set whenever an
	// audit is shown (a fresh run or a restored one); cleared when there's none.
	const runId = ref<string | null>(null);

	// Redaction lifecycle for the current run, and the redacted output it produced
	// (present once done, so the UI can offer a download).
	const redactPhase = ref<StudioRedactPhase>("idle");
	const redactError = ref("");
	const output = ref<{ fileId: string; fileName: string } | null>(null);

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

	// Redaction is offered once a run has analyzed (and isn't already redacting).
	const canRedact = computed(
		() =>
			phase.value === "analyzed" &&
			!!runId.value &&
			redactPhase.value !== "redacting",
	);

	function resetRedaction() {
		redactPhase.value = "idle";
		redactError.value = "";
		output.value = null;
	}

	/**
	 * Apply redactions to the analyzed run, producing its redacted output file.
	 * On success `output` carries the file to download; guarded so a stale result
	 * (the active file changed mid-request) can't overwrite newer state.
	 */
	async function redact() {
		const target = runId.value;
		if (!target || redactPhase.value === "redacting") return;
		const token = restoreToken;
		redactPhase.value = "redacting";
		redactError.value = "";
		try {
			const run = await redactRun(target);
			if (token !== restoreToken) return;
			if (!run.outputFileId)
				throw new Error("The run produced no output file.");
			output.value = {
				fileId: run.outputFileId,
				fileName: run.outputFileName ?? run.outputFileId,
			};
			runStatus.value = run.status;
			redactPhase.value = "done";
		} catch (err) {
			if (token !== restoreToken) return;
			redactPhase.value = "failed";
			redactError.value = getErrorMessage(err, t("studio.audit.redactFailed"));
		}
	}

	/** Download the redacted output file produced by {@link redact}. */
	async function downloadRedacted() {
		if (!output.value) return;
		await downloadOutput(output.value.fileId, output.value.fileName);
	}

	async function run() {
		const file = toValue(fileId);
		if (!file || !selectedPipeline.value) return;
		// Supersede any in-flight restore, and capture the token so a run that
		// finishes after the active file changed can't overwrite the new state.
		const token = ++restoreToken;
		phase.value = "running";
		runStatus.value = "queued";
		restored.value = false;
		errorMessage.value = "";
		audit.value = null;
		runId.value = null;
		resetRedaction();
		try {
			const result = await runDetection(
				selectedPipeline.value,
				{ fileId: file },
				(status) => {
					if (token === restoreToken) runStatus.value = status;
				},
			);
			if (token !== restoreToken) return;
			audit.value = result.audit;
			runId.value = result.runId;
			phase.value = "analyzed";
		} catch (err) {
			if (token !== restoreToken) return;
			phase.value = "failed";
			errorMessage.value = getErrorMessage(err, t("studio.audit.runFailed"));
		}
	}

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
		runId.value = null;
		resetRedaction();
		try {
			const latest = await findLatestRunForFile(file, opts.pipelineSlug);
			// Bail if a newer restore started (file or pipeline changed) meanwhile.
			if (token !== restoreToken) return;
			if (!latest) {
				// Adoption decided: no run for this file, so the default may apply.
				if (opts.adopt) adoptResolved.value = true;
				phase.value = "idle";
				return;
			}
			// Record the run's pipeline to adopt into the picker, and mark adoption
			// resolved so the selection watcher applies it (and never the default).
			if (opts.adopt) {
				pendingAdoptPipeline.value = latest.pipelineSlug;
				adoptResolved.value = true;
			}
			const restoredAudit = await getDetections(latest.id);
			if (token !== restoreToken) return;
			audit.value = restoredAudit;
			runId.value = latest.id;
			runStatus.value = latest.status;
			restored.value = true;
			phase.value = "analyzed";
			// A run that already produced its redacted output: surface it so the
			// panel offers the download without re-running redaction.
			if (latest.outputFileId) {
				output.value = {
					fileId: latest.outputFileId,
					fileName: latest.outputFileName ?? latest.outputFileId,
				};
				redactPhase.value = "done";
			}
		} catch {
			if (token === restoreToken) {
				if (opts.adopt) adoptResolved.value = true; // don't block the default
				phase.value = "idle";
			}
		}
	}

	// On file open, restore the file's most recent run and adopt its pipeline, so
	// opening a file shows its latest audit under the pipeline that produced it.
	watch(
		() => toValue(fileId),
		(file) => {
			// Reset per-file pipeline state so the prior file's choice can't leak:
			// clear the pending adoption, and clear the selection (programmatically,
			// so the pipeline watcher doesn't treat it as a user switch) so the
			// selection watcher can re-pick this file's adopted or default pipeline.
			pendingAdoptPipeline.value = null;
			if (selectedPipeline.value) {
				programmaticPipeline = "";
				selectedPipeline.value = "";
			}
			if (!file) {
				++restoreToken; // supersede any in-flight restore
				adoptResolved.value = true; // nothing to adopt → default may apply
				phase.value = "idle";
				runStatus.value = null;
				restored.value = false;
				errorMessage.value = "";
				audit.value = null;
				runId.value = null;
				resetRedaction();
				return;
			}
			// Wait for this file's restore before defaulting, so the picker doesn't
			// flicker through the wrong pipeline.
			adoptResolved.value = false;
			restoreLatest(file, { adopt: true });
		},
		{ immediate: true },
	);

	// When the user switches the pipeline, restore that pipeline's latest audit
	// for the current file. A programmatic selection (default or adoption) sets
	// `programmaticPipeline` to the same value and is skipped — the file-open flow
	// already handles its restore, so we don't start a competing/wrong one.
	watch(selectedPipeline, (pipeline) => {
		if (pipeline === programmaticPipeline) {
			programmaticPipeline = null; // consume; further changes are user switches
			return;
		}
		// A manual switch overrides any pending adoption for this file.
		pendingAdoptPipeline.value = null;
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
		// Redaction
		redactPhase,
		redactError,
		output,
		canRedact,
		redact,
		downloadRedacted,
	};
}
