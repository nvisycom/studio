import type {
	CreatePolicy,
	Label,
	LabelScope,
	ModalityRedactions,
	PolicyDefinition,
	PolicyRule,
	TextRedaction,
} from "@nvisy/sdk/datatypes";
import type {
	EditableAction,
	EditableOperator,
	EditablePredicate,
	PolicyInput,
	SdkPredicate,
	TextRedactionKind,
} from "./model";
import { csvToList, DEFAULT_TEXT_TEMPLATE } from "./model";

/**
 * Coerce an editor number to a non-negative integer (or a fallback when unset).
 * The inputs carry `min` attributes, but those don't guard this save path, so a
 * negative or fractional value is normalized here before it reaches the SDK.
 */
function nonNegative(value: number | undefined, fallback: number): number {
	if (value == null || !Number.isFinite(value)) return fallback;
	return Math.max(0, Math.floor(value));
}

/** Build one SDK predicate condition from an editable condition. */
function buildCondition(p: EditablePredicate): SdkPredicate {
	switch (p.kind) {
		case "confidence":
			return { kind: "confidence", min: p.min ?? 0 };
		case "labelOneOf":
			return { kind: "labelOneOf", labels: csvToList(p.values) };
		case "labelInScope":
			return { kind: "labelInScope", scope: (p.values ?? "").trim() };
		case "coRef":
			return { kind: "coRef", coref: (p.values ?? "").trim() };
		default:
			return { kind: "tagOneOf", tags: csvToList(p.values) };
	}
}

/** Build the SDK `Predicate` for a rule from its editable conditions. */
function buildPredicate(predicates: EditablePredicate[]): SdkPredicate {
	const parts = predicates.map(buildCondition);
	// A single predicate stands alone; multiple are AND-ed via `all`.
	return parts.length === 1 ? parts[0]! : { kind: "all", all: parts };
}

/** Build a text-vocabulary operator (shared by text and tabular `cell`). */
function buildTextOp(
	op: EditableOperator,
	kind: TextRedactionKind,
): TextRedaction {
	switch (kind) {
		case "mask": {
			const prefix = nonNegative(op.keepPrefix, 0);
			const suffix = nonNegative(op.keepSuffix, 0);
			return {
				kind: "mask",
				mask_char: op.maskChar || "*",
				...(prefix ? { keep_prefix: prefix } : {}),
				...(suffix ? { keep_suffix: suffix } : {}),
			};
		}
		case "replace":
			return {
				kind: "replace",
				template: op.template || DEFAULT_TEXT_TEMPLATE,
			};
		case "hash":
			return {
				kind: "hash",
				algorithm: op.algorithm ?? "sha256",
				...(op.salt?.trim() ? { salt: op.salt.trim() } : {}),
			};
		case "hmac_hash":
			return { kind: "hmac_hash", algorithm: op.algorithm ?? "sha256" };
		case "truncate": {
			const prefix = nonNegative(op.keepPrefix, 0);
			const suffix = nonNegative(op.keepSuffix, 0);
			return {
				kind: "truncate",
				...(prefix ? { keep_prefix: prefix } : {}),
				...(suffix ? { keep_suffix: suffix } : {}),
			};
		}
		case "fake":
			// Params (language, seed) aren't surfaced yet; ship the default template.
			return { kind: "fake", fallback_template: DEFAULT_TEXT_TEMPLATE };
		case "clamp":
			// Numeric bucketing params aren't surfaced yet; the bare operator
			// defaults to erasing non-numeric values.
			return { kind: "clamp" };
		case "generalize_date":
			// Date params aren't surfaced yet; the SDK defaults to year / ISO.
			return { kind: "generalize_date", granularity: "year", style: "iso" };
		default:
			return { kind }; // erase | keep | pseudonymize | encrypt
	}
}

/** Build the SDK `ModalityRedactions` map from the editable operators. */
function buildModalities(
	mods: EditableAction["modalities"],
): ModalityRedactions {
	const out: ModalityRedactions = {};

	if (mods.text) {
		out.text = buildTextOp(mods.text, mods.text.textKind ?? "replace");
	}
	if (mods.image) {
		const k = mods.image.imageKind ?? "blur";
		if (k === "blur")
			out.image = {
				kind: "blur",
				sigma: Math.max(1, nonNegative(mods.image.sigma, 8)),
			};
		else if (k === "pixelate")
			out.image = {
				kind: "pixelate",
				block_size: Math.max(2, nonNegative(mods.image.blockSize, 16)),
			};
		else out.image = { kind: k }; // erase | keep
	}
	if (mods.audio) {
		const k = mods.audio.audioKind ?? "silence";
		if (k === "beep")
			out.audio = {
				kind: "beep",
				hz: Math.max(1, nonNegative(mods.audio.hz, 1000)),
				amplitude: 0.5,
				waveform: "sine",
			};
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
function buildAction(action: EditableAction): ModalityRedactions {
	const mods = action.modalities;
	return Object.keys(mods).length > 0
		? buildModalities(mods)
		: { text: { kind: "replace", template: DEFAULT_TEXT_TEMPLATE } };
}

/** Build a single SDK rule (predicated or table) from an editable rule. */
function buildRule(r: PolicyInput["rules"][number]): PolicyRule {
	const base = {
		id: crypto.randomUUID(),
		name: r.name.trim(),
		description: r.description?.trim() || undefined,
	};
	return r.kind === "table"
		? {
				...base,
				kind: "table",
				operators: r.entries
					.filter((e) => e.label.trim())
					.map((e) => ({
						label: e.label.trim(),
						action: buildAction(e.action),
					})),
			}
		: {
				...base,
				kind: "predicated",
				predicate: buildPredicate(r.predicates),
				action: buildAction(r.action),
			};
}

/** Build the custom-label schemas this policy introduces. */
function buildCustomLabels(input: PolicyInput): Label[] | undefined {
	// The editor edits one locale's name/description; merge that back into the
	// label's preserved localizations so a save never drops its other locales.
	const custom: Label[] = (input.labels ?? [])
		.filter((l) => l.name.trim())
		.map((l) => ({
			id: l.id,
			localizations: {
				...l.localizations,
				[l.locale]: {
					name: l.name.trim(),
					...(l.description?.trim()
						? { description: l.description.trim() }
						: {}),
				},
			},
			tags: csvToList(l.tags),
		}));
	return custom.length > 0 ? custom : undefined;
}

/** Build the named label sets this policy detects (referenced by `labelInScope`). */
function buildScopes(input: PolicyInput): LabelScope[] | undefined {
	const scopes: LabelScope[] = (input.scopes ?? [])
		.filter((s) => s.name.trim() && s.labels.length > 0)
		.map((s) => ({
			name: s.name.trim(),
			...(s.description?.trim() ? { description: s.description.trim() } : {}),
			labels: s.labels,
		}));
	return scopes.length > 0 ? scopes : undefined;
}

/**
 * Build the SDK policy definition body shared by create and update.
 *
 * The editor fully models predicated and table rules, the fallback, custom
 * labels, and label scopes.
 */
export function buildDefinition(input: PolicyInput): PolicyDefinition {
	const rules = input.rules.map(buildRule);
	const custom = buildCustomLabels(input);
	const scopes = buildScopes(input);

	return {
		id: input.id,
		name: input.displayName.trim(),
		description: input.description?.trim() || undefined,
		// `rules` is optional; omit it entirely for a fallback-only policy.
		...(rules.length > 0 ? { rules } : {}),
		...(input.fallback ? { fallback: buildAction(input.fallback) } : {}),
		...(custom ? { custom } : {}),
		...(scopes ? { scopes } : {}),
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
