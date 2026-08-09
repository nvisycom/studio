import type {
	CreatePolicy,
	Label,
	Labels,
	PolicyDefinition,
	PolicyRule,
	PredicatedRule,
} from "@nvisy/sdk/datatypes";

// The editor only handles predicated (entity-level) rules; table rules are a
// separate 0.14 rule variant we don't yet expose. `PolicyRule` is the union of
// both, so we build/read against `PredicatedRule` and skip table rules.

// --- Editor model -----------------------------------------------------------
// A flattened representation of the policy schema the editor supports:
// AND-only conditions (confidence / label / tag), per-modality redact operators
// (text / image / audio / tabular), suppress/audit actions, a fallback action,
// and the label catalog. Recursive predicate trees (any/not) and appliesWhen /
// retention are not yet exposed.

export type PredicateKind = "confidence" | "labelOneOf" | "tagOneOf";

/** A single condition. `all` of a rule's conditions must hold (AND). */
export interface EditablePredicate {
	kind: PredicateKind;
	/** For `confidence`: minimum in [0,1]. */
	min?: number;
	/** For `labelOneOf` / `tagOneOf`: comma-separated values entered by the user. */
	values?: string;
}

export type Modality = "text" | "image" | "audio" | "tabular";

export type TextRedactionKind = "erase" | "mask" | "replace" | "hash" | "keep";
export type ImageRedactionKind = "erase" | "keep" | "blur" | "pixelate";
export type AudioRedactionKind = "erase" | "keep" | "silence" | "beep";
export type TabularRedactionKind =
	| "erase"
	| "mask"
	| "replace"
	| "hash"
	| "keep";

/** A per-modality redaction operator with the params its kind needs. */
export interface EditableOperator {
	textKind?: TextRedactionKind;
	imageKind?: ImageRedactionKind;
	audioKind?: AudioRedactionKind;
	tabularKind?: TabularRedactionKind; // reuses the text vocabulary via `cell`
	/** text/tabular mask char. */
	maskChar?: string;
	/** text/tabular replace template. */
	template?: string;
	/** image blur sigma. */
	sigma?: number;
	/** image pixelate block size. */
	blockSize?: number;
	/** audio beep frequency (Hz). */
	hz?: number;
}

/**
 * A rule action / fallback: per-modality redaction operators (`ModalityRedactions`).
 * Only configured modalities are sent.
 */
export interface EditableAction {
	modalities: Partial<Record<Modality, EditableOperator>>;
}

export interface EditableRule {
	/** Local-only key for list rendering; a fresh uuid is minted on submit. */
	key: string;
	name: string;
	description?: string;
	predicates: EditablePredicate[];
	action: EditableAction;
}

/** An entity-label catalog entry. */
export interface EditableLabel {
	key: string;
	name: string;
	description?: string;
	/** comma-separated tags. */
	tags?: string;
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
): PredicatedRule["predicate"] {
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
	if (parts.length === 1) return parts[0] as PredicatedRule["predicate"];
	return { kind: "all", all: parts } as PredicatedRule["predicate"];
}

/** Build a text-vocabulary operator (shared by text and tabular `cell`). */
function buildTextOp(op: EditableOperator, kind: TextRedactionKind) {
	switch (kind) {
		case "mask":
			return { kind: "mask", mask_char: op.maskChar || "*" };
		case "replace":
			return { kind: "replace", template: op.template || "[{label}]" };
		case "hash":
			return { kind: "hash", algorithm: "sha256" };
		default:
			return { kind }; // erase | keep
	}
}

/** Build the SDK `ModalityRedactions` map from the editable operators. */
function buildModalities(mods: EditableAction["modalities"]) {
	const out: Record<string, unknown> = {};
	if (!mods) return out;

	if (mods.text) {
		out.text = buildTextOp(mods.text, mods.text.textKind ?? "replace");
	}
	if (mods.image) {
		const k = mods.image.imageKind ?? "blur";
		if (k === "blur")
			out.image = { kind: "blur", sigma: mods.image.sigma ?? 8 };
		else if (k === "pixelate")
			out.image = { kind: "pixelate", block_size: mods.image.blockSize ?? 16 };
		else out.image = { kind: k }; // erase | keep
	}
	if (mods.audio) {
		const k = mods.audio.audioKind ?? "silence";
		if (k === "beep") out.audio = { kind: "beep", hz: mods.audio.hz ?? 1000 };
		else out.audio = { kind: k }; // erase | keep | silence
	}
	if (mods.tabular) {
		const k = mods.tabular.tabularKind ?? "replace";
		// The text vocabulary maps onto the tabular `cell` operator.
		out.tabular = { kind: "cell", spec: buildTextOp(mods.tabular, k) };
	}
	return out;
}

/**
 * Build the SDK `ModalityRedactions` (a rule action or fallback) from an
 * editable action. Defaults to a text replace when nothing is configured so
 * the action is never empty.
 */
function buildAction(action: EditableAction): PredicatedRule["action"] {
	const mods = action.modalities;
	const built =
		mods && Object.keys(mods).length > 0
			? buildModalities(mods)
			: { text: { kind: "replace", template: "[{label}]" } };
	return built as PredicatedRule["action"];
}

export interface PolicyInput {
	id: string;
	displayName: string;
	slug: string;
	description?: string;
	rules: EditableRule[];
	/** Catch-all action when no rule matches; null/undefined = none. */
	fallback?: EditableAction | null;
	/** Entity-label catalog. */
	labels?: EditableLabel[];
}

/** Build the SDK policy definition body shared by create and update. */
export function buildDefinition(input: PolicyInput): PolicyDefinition {
	const rules: PolicyRule[] = input.rules.map((r) => ({
		id: crypto.randomUUID(),
		name: r.name.trim(),
		description: r.description?.trim() || undefined,
		predicate: buildPredicate(r.predicates),
		action: buildAction(r.action),
	}));

	// The editor's simple name/description/tags map to a single default-locale
	// custom label. `Labels` is an object ({ builtins?, custom? }), not an array.
	const customLabels: Label[] = (input.labels ?? [])
		.filter((l) => l.name.trim())
		.map((l) => ({
			id: crypto.randomUUID(),
			localizations: {
				en: {
					name: l.name.trim(),
					...(l.description?.trim()
						? { description: l.description.trim() }
						: {}),
				},
			},
			tags: splitValues(l.tags),
		}));

	return {
		id: input.id,
		name: input.displayName.trim(),
		description: input.description?.trim() || undefined,
		// `rules` is optional; omit it entirely for a fallback-only policy.
		...(rules.length > 0 ? { rules } : {}),
		...(input.fallback ? { fallback: buildAction(input.fallback) } : {}),
		...(customLabels.length > 0 ? { labels: { custom: customLabels } } : {}),
	} as PolicyDefinition;
}

/**
 * Assemble a `CreatePolicy` payload from the editor's field values. 0.14 makes
 * CreatePolicy a discriminated union (`source: "template" | "inline"`); the
 * editor always builds an inline definition.
 */
export function buildCreatePolicy(input: PolicyInput): CreatePolicy {
	return {
		slug: input.slug,
		displayName: input.displayName.trim(),
		description: input.description?.trim() || undefined,
		source: "inline",
		definition: buildDefinition(input),
	};
}

// --- Reverse mapping (SDK definition -> editable model) ---------------------
// Used when opening the editor on an existing policy. Predicate/action shapes
// the phase-1 editor can't represent (any/not/coRef, non-text redactions)
// degrade to their closest editable form.

type SdkPredicate = PredicatedRule["predicate"];
type SdkAction = PredicatedRule["action"];

/**
 * A structural view of `ModalityRedactions` exposing just the common fields the
 * editor reads. The real operators are per-kind discriminated unions; this view
 * is the one deliberate widening we do when reversing them into the flat model.
 */
type ModalityRedactionsView = {
	text?: { kind?: string; mask_char?: string; template?: string };
	image?: { kind?: string; sigma?: number; block_size?: number };
	audio?: { kind?: string; hz?: number };
	tabular?: {
		spec?: { kind?: string; mask_char?: string; template?: string };
	};
};

function predicateToEditable(pred: SdkPredicate): EditablePredicate[] {
	// Flatten a top-level `all` into individual conditions; anything else is a
	// single condition. The discriminated `kind` narrows each arm — no casts.
	const parts: SdkPredicate[] = pred.kind === "all" ? pred.all : [pred];

	const editable: EditablePredicate[] = [];
	for (const p of parts) {
		if (p.kind === "confidence") {
			editable.push({ kind: "confidence", min: p.min });
		} else if (p.kind === "labelOneOf") {
			editable.push({
				kind: "labelOneOf",
				values: p.labels.join(", "),
			});
		} else if (p.kind === "tagOneOf") {
			editable.push({
				kind: "tagOneOf",
				values: p.tags.join(", "),
			});
		}
		// labelInGroup/coRef/any/not aren't representable in the editor; skip them.
	}
	// Always keep at least one condition so the rule stays editable.
	return editable.length > 0 ? editable : [{ kind: "confidence", min: 0.5 }];
}

function textOpToEditable(op: {
	kind?: string;
	mask_char?: string;
	template?: string;
}): EditableOperator {
	return {
		textKind: (op.kind ?? "replace") as TextRedactionKind,
		maskChar: op.mask_char,
		template: op.template,
	};
}

function actionToEditable(action: SdkAction): EditableAction {
	if (!action) {
		return {
			modalities: { text: { textKind: "replace", template: "[{label}]" } },
		};
	}
	// Each modality operator is a discriminated union whose fields vary by kind.
	// The editor reads a common subset (kind + a couple of params), so we take a
	// single structural view of the whole map rather than narrowing every arm.
	const a = action as ModalityRedactionsView;
	const modalities: EditableAction["modalities"] = {};
	if (a.text) modalities.text = textOpToEditable(a.text);
	if (a.image) {
		modalities.image = {
			imageKind: (a.image.kind ?? "blur") as ImageRedactionKind,
			sigma: a.image.sigma,
			blockSize: a.image.block_size,
		};
	}
	if (a.audio) {
		modalities.audio = {
			audioKind: (a.audio.kind ?? "silence") as AudioRedactionKind,
			hz: a.audio.hz,
		};
	}
	if (a.tabular?.spec) {
		const t = textOpToEditable(a.tabular.spec);
		modalities.tabular = {
			tabularKind: (t.textKind ?? "replace") as TabularRedactionKind,
			maskChar: t.maskChar,
			template: t.template,
		};
	}
	// Ensure at least one modality is present for editing.
	if (Object.keys(modalities).length === 0) {
		modalities.text = { textKind: "replace", template: "[{label}]" };
	}
	return { modalities };
}

/** Reconstruct the fallback action (or null) from a stored definition. */
export function fallbackFromDefinition(
	definition: PolicyDefinition,
): EditableAction | null {
	const fb = definition.fallback;
	return fb ? actionToEditable(fb) : null;
}

/**
 * Reconstruct the editable label catalog from a stored definition. `labels` is
 * an object with an optional `custom` array; each custom label carries
 * localized names, so we read the first available locale into the editor's
 * flat name/description.
 */
export function labelsFromDefinition(
	definition: PolicyDefinition,
): EditableLabel[] {
	const labels: Labels | undefined = definition.labels;
	return (labels?.custom ?? []).map((l) => {
		const locale = Object.values(l.localizations)[0];
		return {
			key: crypto.randomUUID(),
			name: locale?.name ?? "",
			description: locale?.description,
			tags: l.tags.join(", "),
		};
	});
}

/** Narrow a `PolicyRule` to a predicated rule (the editor's only supported kind). */
function isPredicatedRule(rule: PolicyRule): rule is PredicatedRule {
	return "predicate" in rule && "action" in rule;
}

/**
 * Reconstruct the editable rule list from a stored policy definition. Table
 * rules (the other 0.14 `PolicyRule` variant) aren't editable here and are
 * skipped.
 */
export function rulesFromDefinition(
	definition: PolicyDefinition,
): EditableRule[] {
	return (definition.rules ?? []).filter(isPredicatedRule).map((r) => ({
		key: crypto.randomUUID(),
		name: r.name,
		description: r.description,
		predicates: predicateToEditable(r.predicate),
		action: actionToEditable(r.action),
	}));
}
