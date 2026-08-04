import type {
	CreatePolicy,
	PolicyDefinition,
	PolicyRule,
	UpdatePolicy,
} from "@nvisy/sdk/datatypes";

/** Policy-body version we stamp on newly created/edited policies. */
export const POLICY_VERSION = "1.0.0";

// --- Phase 1 editor model ---------------------------------------------------
// A simplified, flat representation of the parts of the policy schema the
// current editor supports. Recursive predicate trees (not/deep nesting) and
// image/audio/tabular redaction operators are intentionally left for later.

export type PredicateKind = "confidence" | "labelOneOf" | "tagOneOf";

/** A single condition. `all` of a rule's conditions must hold (AND). */
export interface EditablePredicate {
	kind: PredicateKind;
	/** For `confidence`: minimum in [0,1]. */
	min?: number;
	/** For `labelOneOf` / `tagOneOf`: comma-separated values entered by the user. */
	values?: string;
}

export type ActionKind = "redact" | "suppress" | "audit";
export type TextRedactionKind = "erase" | "mask" | "replace" | "hash" | "keep";

export interface EditableAction {
	kind: ActionKind;
	/** redact: the text-modality operator. */
	textKind?: TextRedactionKind;
	/** mask: char used for masked positions. */
	maskChar?: string;
	/** replace: template string, e.g. "[{label}]". */
	template?: string;
	/** suppress reason / audit severity. */
	note?: string;
}

export interface EditableRule {
	/** Local-only key for list rendering; a fresh uuid is minted on submit. */
	key: string;
	name: string;
	description?: string;
	predicates: EditablePredicate[];
	action: EditableAction;
}

function splitValues(raw?: string): string[] {
	return (raw ?? "")
		.split(",")
		.map((v) => v.trim())
		.filter(Boolean);
}

/** Build the SDK `Predicate` for a rule from its editable conditions. */
function buildPredicate(
	predicates: EditablePredicate[],
): PolicyRule["predicate"] {
	const parts = predicates.map((p) => {
		if (p.kind === "confidence") {
			return { kind: "confidence" as const, min: p.min ?? 0 };
		}
		if (p.kind === "labelOneOf") {
			return { kind: "labelOneOf" as const, labels: splitValues(p.values) };
		}
		return { kind: "tagOneOf" as const, tags: splitValues(p.values) };
	});
	// A single predicate stands alone; multiple are AND-ed via `all`.
	if (parts.length === 1) return parts[0] as PolicyRule["predicate"];
	return { kind: "all", all: parts } as PolicyRule["predicate"];
}

/** Build the SDK `PolicyAction` from an editable action. */
function buildAction(action: EditableAction): PolicyRule["action"] {
	if (action.kind === "suppress") {
		return { kind: "suppress", reason: action.note || undefined };
	}
	if (action.kind === "audit") {
		return { kind: "audit", severity: action.note || undefined };
	}
	// redact: text-modality operator only (phase 1).
	const textKind = action.textKind ?? "replace";
	let text: Record<string, unknown>;
	switch (textKind) {
		case "mask":
			text = { kind: "mask", mask_char: action.maskChar || "*" };
			break;
		case "replace":
			text = { kind: "replace", template: action.template || "[{label}]" };
			break;
		case "hash":
			text = { kind: "hash", algorithm: "sha256" };
			break;
		default:
			text = { kind: textKind }; // erase | keep
	}
	return { kind: "redact", text } as PolicyRule["action"];
}

interface PolicyInput {
	id: string;
	displayName: string;
	slug: string;
	description?: string;
	rules: EditableRule[];
}

/** Build the SDK policy definition body shared by create and update. */
function buildDefinition(input: PolicyInput): PolicyDefinition {
	const rules: PolicyRule[] = input.rules.map((r) => ({
		id: crypto.randomUUID(),
		name: r.name.trim(),
		description: r.description?.trim() || undefined,
		predicate: buildPredicate(r.predicates),
		action: buildAction(r.action),
	}));

	return {
		id: input.id,
		name: input.displayName.trim(),
		version: POLICY_VERSION,
		description: input.description?.trim() || undefined,
		rules,
	};
}

/** Assemble a `CreatePolicy` payload from the editor's field values. */
export function buildCreatePolicy(input: PolicyInput): CreatePolicy {
	return {
		slug: input.slug,
		displayName: input.displayName.trim(),
		description: input.description?.trim() || undefined,
		definition: buildDefinition(input),
	};
}

/** Assemble an `UpdatePolicy` payload (slug is immutable, so it is omitted). */
export function buildUpdatePolicy(input: PolicyInput): UpdatePolicy {
	return {
		displayName: input.displayName.trim(),
		description: input.description?.trim() || undefined,
		definition: buildDefinition(input),
	};
}

// --- Reverse mapping (SDK definition -> editable model) ---------------------
// Used when opening the editor on an existing policy. Predicate/action shapes
// the phase-1 editor can't represent (any/not/coRef, non-text redactions)
// degrade to their closest editable form.

type SdkPredicate = PolicyRule["predicate"];
type SdkAction = PolicyRule["action"];

function predicateToEditable(pred: SdkPredicate): EditablePredicate[] {
	// Flatten a top-level `all` into individual conditions; anything else is a
	// single condition.
	const parts: SdkPredicate[] =
		pred && "kind" in pred && pred.kind === "all"
			? ((pred as { all: SdkPredicate[] }).all ?? [])
			: [pred];

	const editable: EditablePredicate[] = [];
	for (const p of parts) {
		if (!p || !("kind" in p)) continue;
		if (p.kind === "confidence") {
			editable.push({ kind: "confidence", min: (p as { min: number }).min });
		} else if (p.kind === "labelOneOf") {
			editable.push({
				kind: "labelOneOf",
				values: ((p as { labels: string[] }).labels ?? []).join(", "),
			});
		} else if (p.kind === "tagOneOf") {
			editable.push({
				kind: "tagOneOf",
				values: ((p as { tags: string[] }).tags ?? []).join(", "),
			});
		}
		// any/not/coRef are not representable in the phase-1 editor; skip them.
	}
	// Always keep at least one condition so the rule stays editable.
	return editable.length > 0 ? editable : [{ kind: "confidence", min: 0.5 }];
}

function actionToEditable(action: SdkAction): EditableAction {
	if (!action || !("kind" in action)) {
		return { kind: "redact", textKind: "replace", template: "[{label}]" };
	}
	if (action.kind === "suppress") {
		return { kind: "suppress", note: (action as { reason?: string }).reason };
	}
	if (action.kind === "audit") {
		return { kind: "audit", note: (action as { severity?: string }).severity };
	}
	// redact: read the text operator (other modalities aren't editable yet).
	const text = (action as { text?: { kind?: string } }).text;
	const textKind = (text?.kind ?? "replace") as TextRedactionKind;
	return {
		kind: "redact",
		textKind,
		maskChar: (text as { mask_char?: string })?.mask_char,
		template: (text as { template?: string })?.template,
	};
}

/** Reconstruct the editable rule list from a stored policy definition. */
export function rulesFromDefinition(
	definition: PolicyDefinition,
): EditableRule[] {
	return (definition.rules ?? []).map((r) => ({
		key: crypto.randomUUID(),
		name: r.name,
		description: r.description,
		predicates: predicateToEditable(r.predicate),
		action: actionToEditable(r.action),
	}));
}
