import type { Retention } from "@nvisy/sdk/datatypes";

/**
 * Shared model for the workspace retention form (used by the create-workspace
 * sheet and the workspace-settings Data page). A `Retention` is a discriminated
 * union `{mode} (| {days})`; the form flattens it to a `mode` plus a day count
 * that only the `days` mode reads, so switching modes keeps the last entered
 * number around.
 */

export type RetentionMode = Retention["mode"];

export interface RetentionField {
	mode: RetentionMode;
	days: number;
}

/** Retention mode options, in display order. */
export const RETENTION_MODES: RetentionMode[] = ["forever", "days", "zeroDays"];

/** The three retention scopes a workspace configures. */
export const RETENTION_TARGETS = [
	"auditLogs",
	"originalDocuments",
	"redactedDocuments",
] as const;
export type RetentionTarget = (typeof RETENTION_TARGETS)[number];

/** The full per-target retention state the form edits. */
export type RetentionForm = Record<RetentionTarget, RetentionField>;

/** A fresh field: keep forever, with a sensible default day count for `days`. */
export function newRetentionField(): RetentionField {
	return { mode: "forever", days: 30 };
}

/** A fresh form with every target set to the default field. */
export function defaultRetentionForm(): RetentionForm {
	return {
		auditLogs: newRetentionField(),
		originalDocuments: newRetentionField(),
		redactedDocuments: newRetentionField(),
	};
}

/** SDK `Retention` -> editable field (used when loading existing settings). */
export function retentionToField(r: Retention): RetentionField {
	return r.mode === "days"
		? { mode: "days", days: r.days }
		: { mode: r.mode, days: 30 };
}

/** Editable field -> SDK `Retention` (used when building the save payload). */
export function fieldToRetention(f: RetentionField): Retention {
	return f.mode === "days" ? { mode: "days", days: f.days } : { mode: f.mode };
}

/** The whole form -> the SDK retention object for `WorkspaceSettings`. */
export function formToRetention(form: RetentionForm) {
	return {
		auditLogs: fieldToRetention(form.auditLogs),
		originalDocuments: fieldToRetention(form.originalDocuments),
		redactedDocuments: fieldToRetention(form.redactedDocuments),
	};
}

/**
 * An existing SDK retention object -> the editable form. Every scope is optional
 * on `RetentionSettings` (and the whole object may be absent); a missing scope
 * defaults to "forever", matching the SDK's own default.
 */
const FOREVER: Retention = { mode: "forever" };
export function retentionToForm(r?: {
	auditLogs?: Retention;
	originalDocuments?: Retention;
	redactedDocuments?: Retention;
}): RetentionForm {
	return {
		auditLogs: retentionToField(r?.auditLogs ?? FOREVER),
		originalDocuments: retentionToField(r?.originalDocuments ?? FOREVER),
		redactedDocuments: retentionToField(r?.redactedDocuments ?? FOREVER),
	};
}

/**
 * Structural equality for two `Retention` values — same mode, and same day
 * count when the mode is "days". Avoids JSON.stringify, whose key order differs
 * between the form-built object and the SDK's, which made the form look dirty.
 */
export function retentionEquals(a: Retention, b: Retention): boolean {
	if (a.mode !== b.mode) return false;
	return a.mode === "days" && b.mode === "days" ? a.days === b.days : true;
}
