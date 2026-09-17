import type { Retention, RetentionSettings } from "@nvisy/sdk/datatypes";

/**
 * Shared model for the workspace retention form (used by the create-workspace
 * sheet and the workspace-settings Data page). A `Retention` is a discriminated
 * union `{mode} (| {days})` — `persistent` (keep), `ephemeral` (don't keep), or
 * `fixed` (keep N days). The form flattens it to a `mode` plus a day count that
 * only `fixed` reads, so switching modes keeps the last entered number around.
 */

export type RetentionMode = Retention["mode"];

export interface RetentionField {
	mode: RetentionMode;
	days: number;
}

/** Retention mode options, in display order. */
export const RETENTION_MODES: RetentionMode[] = [
	"persistent",
	"fixed",
	"ephemeral",
];

/** The retention scopes a workspace configures. */
export const RETENTION_TARGETS = [
	"auditLogs",
	"intermediates",
	"originalDocuments",
	"redactedDocuments",
] as const;
export type RetentionTarget = (typeof RETENTION_TARGETS)[number];

/** The full per-target retention state the form edits. */
export type RetentionForm = Record<RetentionTarget, RetentionField>;

/** A fresh field: keep persistently, with a sensible default day count. */
export function newRetentionField(): RetentionField {
	return { mode: "persistent", days: 30 };
}

/** A fresh form with every target set to the default field. */
export function defaultRetentionForm(): RetentionForm {
	return {
		auditLogs: newRetentionField(),
		intermediates: newRetentionField(),
		originalDocuments: newRetentionField(),
		redactedDocuments: newRetentionField(),
	};
}

/** SDK `Retention` -> editable field (used when loading existing settings). */
export function retentionToField(r: Retention): RetentionField {
	return r.mode === "fixed"
		? { mode: "fixed", days: r.days }
		: { mode: r.mode, days: 30 };
}

/** Editable field -> SDK `Retention` (used when building the save payload). */
export function fieldToRetention(f: RetentionField): Retention {
	return f.mode === "fixed"
		? { mode: "fixed", days: f.days }
		: { mode: f.mode };
}

/** The whole form -> the SDK retention object for `WorkspaceSettings`. */
export function formToRetention(form: RetentionForm) {
	return {
		auditLogs: fieldToRetention(form.auditLogs),
		intermediates: fieldToRetention(form.intermediates),
		originalDocuments: fieldToRetention(form.originalDocuments),
		redactedDocuments: fieldToRetention(form.redactedDocuments),
	};
}

/**
 * An existing SDK retention object -> the editable form. Every scope is optional
 * on `RetentionSettings` (and the whole object may be absent); a missing scope
 * defaults to "ephemeral", matching the SDK's own default.
 */
const EPHEMERAL: Retention = { mode: "ephemeral" };
export function retentionToForm(r?: RetentionSettings): RetentionForm {
	return {
		auditLogs: retentionToField(r?.auditLogs ?? EPHEMERAL),
		intermediates: retentionToField(r?.intermediates ?? EPHEMERAL),
		originalDocuments: retentionToField(r?.originalDocuments ?? EPHEMERAL),
		redactedDocuments: retentionToField(r?.redactedDocuments ?? EPHEMERAL),
	};
}

/**
 * Structural equality for two `Retention` values — same mode, and same day
 * count when the mode is "fixed". Avoids JSON.stringify, whose key order differs
 * between the form-built object and the SDK's, which made the form look dirty.
 */
export function retentionEquals(a: Retention, b: Retention): boolean {
	if (a.mode !== b.mode) return false;
	return a.mode === "fixed" && b.mode === "fixed" ? a.days === b.days : true;
}
