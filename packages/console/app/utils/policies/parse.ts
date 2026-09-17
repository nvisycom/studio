import type { Policy, PolicyRule, TextRedaction } from "@nvisy/sdk/datatypes";
import type {
	EditableAction,
	EditableLabel,
	EditableMatcher,
	EditableOperator,
	EditablePredicate,
	EditableRule,
	EditableScope,
	ImageRedactionKind,
	SdkAction,
	SdkPredicate,
	TextRedactionKind,
} from "./model";
import { DEFAULT_TEXT_TEMPLATE } from "./model";

/*
 * Reverse mapping (SDK definition → editable model), used when opening the
 * editor on an existing policy. Predicate/action shapes the flat editor can't
 * represent (any/not, non-modeled operator kinds) degrade to their closest
 * editable form.
 */

function predicateToEditable(pred: SdkPredicate): EditablePredicate[] {
	// Flatten a top-level `all` into individual conditions; anything else is a
	// single condition. The discriminated `kind` narrows each arm — no casts.
	const parts: SdkPredicate[] = pred.kind === "all" ? pred.all : [pred];

	const editable: EditablePredicate[] = [];
	for (const p of parts) {
		if (p.kind === "confidence") {
			editable.push({ kind: "confidence", min: p.min });
		} else if (p.kind === "labelOneOf") {
			editable.push({ kind: "labelOneOf", values: p.labels.join(", ") });
		} else if (p.kind === "tagOneOf") {
			editable.push({ kind: "tagOneOf", values: p.tags.join(", ") });
		} else if (p.kind === "labelInScope") {
			editable.push({ kind: "labelInScope", values: p.scope });
		} else if (p.kind === "coRef") {
			editable.push({ kind: "coRef", values: p.coref });
		}
		// any/not aren't representable in the flat editor; skip them.
	}
	// Always keep at least one condition so the rule stays editable.
	return editable.length > 0 ? editable : [{ kind: "confidence", min: 0.5 }];
}

// The editor models a curated subset of each SDK operator's kinds; ops outside
// that subset degrade to the modality's default kind when reversed. A Set<string>
// membership test narrows an SDK kind to the editor subset without a cast.
const TEXT_KINDS = new Set<string>([
	"erase",
	"keep",
	"mask",
	"replace",
	"hash",
	"hmac_hash",
	"truncate",
	"pseudonymize",
	"encrypt",
	"fake",
	"clamp",
	"generalize_date",
]);
const IMAGE_KINDS = new Set<string>(["erase", "keep", "blur", "pixelate"]);

function isTextKind(kind: string): kind is TextRedactionKind {
	return TEXT_KINDS.has(kind);
}
function isImageKind(kind: string): kind is ImageRedactionKind {
	return IMAGE_KINDS.has(kind);
}

/** Read an SDK text operator into the editor, narrowing by `kind` (no casts). */
function textOpToEditable(op: TextRedaction): EditableOperator {
	return {
		textKind: isTextKind(op.kind) ? op.kind : "replace",
		maskChar: op.kind === "mask" ? op.mask_char : undefined,
		template: op.kind === "replace" ? op.template : undefined,
		keepPrefix:
			op.kind === "mask" || op.kind === "truncate" ? op.keep_prefix : undefined,
		keepSuffix:
			op.kind === "mask" || op.kind === "truncate" ? op.keep_suffix : undefined,
		algorithm:
			op.kind === "hash" || op.kind === "hmac_hash" ? op.algorithm : undefined,
		salt: op.kind === "hash" ? op.salt : undefined,
	};
}

/** A text operator's editable fields reused as a tabular (cell) operator. */
function textToTabular(op: EditableOperator): EditableOperator {
	// TabularRedactionKind aliases TextRedactionKind, so textKind maps directly.
	return {
		tabularKind: op.textKind,
		maskChar: op.maskChar,
		template: op.template,
		keepPrefix: op.keepPrefix,
		keepSuffix: op.keepSuffix,
		algorithm: op.algorithm,
		salt: op.salt,
	};
}

function actionToEditable(action: SdkAction): EditableAction {
	// Each modality operator is a discriminated union; narrow by `kind` to pull
	// the fields that arm actually carries — no structural widening.
	const modalities: EditableAction["modalities"] = {};
	if (action?.text) modalities.text = textOpToEditable(action.text);
	if (action?.image) {
		const image = action.image;
		modalities.image = {
			imageKind: isImageKind(image.kind) ? image.kind : "blur",
			sigma: image.kind === "blur" ? image.sigma : undefined,
			blockSize: image.kind === "pixelate" ? image.block_size : undefined,
		};
	}
	if (action?.audio) {
		const audio = action.audio;
		modalities.audio = {
			audioKind: audio.kind,
			hz: audio.kind === "beep" ? audio.hz : undefined,
		};
	}
	if (action?.tabular?.kind === "cell") {
		modalities.tabular = textToTabular(textOpToEditable(action.tabular.spec));
	} else if (action?.tabular) {
		// A drop_row / drop_column operator carries no cell spec or params.
		modalities.tabular = { tabularKind: action.tabular.kind };
	}
	// Ensure at least one modality is present for editing.
	if (Object.keys(modalities).length === 0) {
		modalities.text = { textKind: "replace", template: DEFAULT_TEXT_TEMPLATE };
	}
	return { modalities };
}

/** Reconstruct the fallback action (or null) from a stored policy. */
export function fallbackFromDefinition(policy: Policy): EditableAction | null {
	return policy.fallback ? actionToEditable(policy.fallback) : null;
}

// A stored policy carries its rules and fallback, but not the custom labels,
// label scopes, or custom matchers used to author it — those are recognition
// inputs, not part of the returned policy. The editor cannot repopulate them
// when opening an existing policy, so these readers resolve to empty. They stay
// to keep the editor's shape stable (see SDK_0.51_MIGRATION_GAPS.md).

/** The editable custom-label list for an existing policy. */
export function labelsFromDefinition(_policy: Policy): EditableLabel[] {
	return [];
}

/** The editable label scopes for an existing policy. */
export function scopesFromDefinition(_policy: Policy): EditableScope[] {
	return [];
}

/** The editable custom matchers for an existing policy. */
export function matchersFromDefinition(_policy: Policy): EditableMatcher[] {
	return [];
}

/** Narrow a `PolicyRule` to the table arm by its `kind` discriminant. */
function isTableRule(
	rule: PolicyRule,
): rule is Extract<PolicyRule, { kind: "table" }> {
	return rule.kind === "table";
}

/**
 * Reconstruct the editable rule list from a stored policy. Both predicated rules
 * (When → Then) and table rules (per-label action lookups) are represented.
 */
export function rulesFromDefinition(policy: Policy): EditableRule[] {
	return (policy.rules ?? []).map((r): EditableRule => {
		if (isTableRule(r)) {
			return {
				kind: "table",
				key: crypto.randomUUID(),
				name: r.name,
				description: r.description,
				entries: (r.operators ?? []).map((op) => ({
					key: crypto.randomUUID(),
					label: op.label,
					action: actionToEditable(op.action),
				})),
			};
		}
		return {
			kind: "predicated",
			key: crypto.randomUUID(),
			name: r.name,
			description: r.description,
			predicates: predicateToEditable(r.predicate),
			action: actionToEditable(r.action),
		};
	});
}
