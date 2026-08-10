import type {
	CreatePolicy,
	Label,
	Labels,
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
import { DEFAULT_TEXT_TEMPLATE } from "./model";

/** Split a comma-separated field into trimmed, non-empty values. */
function splitValues(raw?: string): string[] {
	return (raw ?? "")
		.split(",")
		.map((v) => v.trim())
		.filter(Boolean);
}

/** Build one SDK predicate condition from an editable condition. */
function buildCondition(p: EditablePredicate): SdkPredicate {
	switch (p.kind) {
		case "confidence":
			return { kind: "confidence", min: p.min ?? 0 };
		case "labelOneOf":
			return { kind: "labelOneOf", labels: splitValues(p.values) };
		case "labelInGroup":
			return { kind: "labelInGroup", group: (p.values ?? "").trim() };
		case "coRef":
			return { kind: "coRef", coref: (p.values ?? "").trim() };
		default:
			return { kind: "tagOneOf", tags: splitValues(p.values) };
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
		case "mask":
			return { kind: "mask", mask_char: op.maskChar || "*" };
		case "replace":
			return {
				kind: "replace",
				template: op.template || DEFAULT_TEXT_TEMPLATE,
			};
		case "hash":
			return { kind: "hash", algorithm: "sha256" };
		default:
			return { kind }; // erase | keep
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
			out.image = { kind: "blur", sigma: mods.image.sigma ?? 8 };
		else if (k === "pixelate")
			out.image = { kind: "pixelate", block_size: mods.image.blockSize ?? 16 };
		else out.image = { kind: k }; // erase | keep
	}
	if (mods.audio) {
		const k = mods.audio.audioKind ?? "silence";
		if (k === "beep")
			out.audio = {
				kind: "beep",
				hz: mods.audio.hz ?? 1000,
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

/** Build the custom-label catalog, preserving builtins from the original. */
function buildLabels(input: PolicyInput): Labels | undefined {
	// The editor's simple name/description/tags map to a single default-locale
	// custom label.
	const custom: Label[] = (input.labels ?? [])
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

	const builtins = input.original?.labels?.builtins;
	if (custom.length === 0 && !builtins?.length) return undefined;
	return {
		...(builtins?.length ? { builtins } : {}),
		...(custom.length > 0 ? { custom } : {}),
	};
}

/**
 * Build the SDK policy definition body shared by create and update.
 *
 * The editor fully models predicated and table rules, the fallback, custom
 * labels, and groups. When editing, `builtins` from the original definition are
 * carried through untouched.
 */
export function buildDefinition(input: PolicyInput): PolicyDefinition {
	const rules = input.rules.map(buildRule);
	const labels = buildLabels(input);

	// Named label groups (referenced by `labelInGroup` predicates).
	const groups = (input.groups ?? [])
		.filter((g) => g.name.trim())
		.map((g) => ({
			name: g.name.trim(),
			description: g.description?.trim() || undefined,
			labels: splitValues(g.labels),
		}));

	return {
		id: input.id,
		name: input.displayName.trim(),
		description: input.description?.trim() || undefined,
		// `rules` is optional; omit it entirely for a fallback-only policy.
		...(rules.length > 0 ? { rules } : {}),
		...(input.fallback ? { fallback: buildAction(input.fallback) } : {}),
		...(labels ? { labels } : {}),
		...(groups.length > 0 ? { groups } : {}),
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
