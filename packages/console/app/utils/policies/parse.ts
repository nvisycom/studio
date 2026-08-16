import type {
	PolicyDefinition,
	PolicyRule,
	TextRedaction,
} from "@nvisy/sdk/datatypes";
import type {
	EditableAction,
	EditableLabel,
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
	}
	// Ensure at least one modality is present for editing.
	if (Object.keys(modalities).length === 0) {
		modalities.text = { textKind: "replace", template: DEFAULT_TEXT_TEMPLATE };
	}
	return { modalities };
}

/** Reconstruct the fallback action (or null) from a stored definition. */
export function fallbackFromDefinition(
	definition: PolicyDefinition,
): EditableAction | null {
	return definition.fallback ? actionToEditable(definition.fallback) : null;
}

/**
 * Reconstruct the editable custom-label list from a stored definition. The
 * editor surfaces one locale (English when present, else the first available);
 * every localization is retained so a save preserves the label's other locales.
 */
export function labelsFromDefinition(
	definition: PolicyDefinition,
): EditableLabel[] {
	return (definition.custom ?? []).map((l) => {
		const localizations = l.localizations ?? {};
		const locale = "en" in localizations ? "en" : Object.keys(localizations)[0];
		const shown = locale ? localizations[locale] : undefined;
		return {
			key: crypto.randomUUID(),
			id: l.id,
			locale: locale ?? "en",
			name: shown?.name ?? "",
			description: shown?.description,
			tags: l.tags.join(", "),
			localizations,
		};
	});
}

/** Reconstruct the editable label scopes from a stored definition. */
export function scopesFromDefinition(
	definition: PolicyDefinition,
): EditableScope[] {
	return (definition.scopes ?? []).map((s) => ({
		key: crypto.randomUUID(),
		name: s.name,
		description: s.description,
		labels: s.labels,
	}));
}

/** Narrow a `PolicyRule` to the table arm by its `kind` discriminant. */
function isTableRule(
	rule: PolicyRule,
): rule is Extract<PolicyRule, { kind: "table" }> {
	return rule.kind === "table";
}

/**
 * Reconstruct the editable rule list from a stored policy definition. Both
 * predicated rules (When → Then) and table rules (per-label action lookups) are
 * represented.
 */
export function rulesFromDefinition(
	definition: PolicyDefinition,
): EditableRule[] {
	return (definition.rules ?? []).map((r): EditableRule => {
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
