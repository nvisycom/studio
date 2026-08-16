import type {
	AudioRedaction,
	ImageRedaction,
	PolicyRule,
	Predicate,
	TextRedaction,
} from "@nvisy/sdk/datatypes";

/**
 * The policy editor's model: a flattened, editable representation of the SDK
 * policy schema. It covers AND-only predicate conditions (confidence / label /
 * tag / labelInScope / coRef), per-modality redaction operators (text / image /
 * audio / tabular), table rules, a fallback action, custom labels, and label
 * scopes. Recursive predicate trees (`any` / `not`) are not yet exposed; the
 * build/parse steps preserve or degrade those.
 */

// 0.16 merged the rule variants into one `PolicyRule` discriminated by `kind`.
// The predicated arm (predicate + action) is what most builders reference.
export type PredicatedRule = Extract<PolicyRule, { kind: "predicated" }>;
export type SdkPredicate = PredicatedRule["predicate"];
export type SdkAction = PredicatedRule["action"];

// Leaf predicates the editor exposes: every SDK predicate kind except the
// recursive combinators (`all` / `any` / `not`), which the flat editor can't
// build yet. Deriving from the SDK means a renamed/removed kind is a type error
// here instead of silently drifting.
export type PredicateKind = Exclude<Predicate["kind"], "all" | "any" | "not">;

/** A single condition. `all` of a rule's conditions must hold (AND). */
export interface EditablePredicate {
	kind: PredicateKind;
	/** For `confidence`: minimum in [0,1]. */
	min?: number;
	/**
	 * For `labelOneOf` / `tagOneOf`: comma-separated values. For `labelInScope`
	 * (a scope name) / `coRef` (a cluster id): a single value.
	 */
	values?: string;
}

export type Modality = "text" | "image" | "audio" | "tabular";

/** Compile-time assertion that `T` only names kinds the SDK union `U` defines. */
type SubsetOf<T extends U, U> = T;

// Curated subsets of the SDK operator vocabularies. The `SubsetOf` guard makes
// the build fail if the SDK renames or drops one of these kinds, without
// widening the editor to operators it can't construct.
export type TextRedactionKind = SubsetOf<
	| "erase"
	| "keep"
	| "mask"
	| "replace"
	| "hash"
	| "hmac_hash"
	| "truncate"
	| "pseudonymize"
	| "encrypt"
	| "fake"
	| "clamp"
	| "generalize_date",
	TextRedaction["kind"]
>;

/** SHA-2 variant for the hashing operators (`hash` / `hmac_hash`). */
export type HashAlgorithm = "sha256" | "sha512";
export type ImageRedactionKind = SubsetOf<
	"erase" | "keep" | "blur" | "pixelate",
	ImageRedaction["kind"]
>;
/** The editor supports every audio operator the SDK offers. */
export type AudioRedactionKind = AudioRedaction["kind"];
/** Tabular cells reuse the text vocabulary (wrapped in a `cell` operator). */
export type TabularRedactionKind = TextRedactionKind;

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
	/** text/tabular chars kept at the start (mask / truncate). */
	keepPrefix?: number;
	/** text/tabular chars kept at the end (mask / truncate). */
	keepSuffix?: number;
	/** text/tabular hash variant (hash / hmac_hash). */
	algorithm?: HashAlgorithm;
	/** text/tabular hash salt. */
	salt?: string;
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

/** A predicated (When → Then) rule: a condition applies one action. */
export interface EditablePredicatedRule {
	kind: "predicated";
	/** Local-only key for list rendering; a fresh uuid is minted on submit. */
	key: string;
	name: string;
	description?: string;
	predicates: EditablePredicate[];
	action: EditableAction;
}

/** One `label → action` row of a table rule. */
export interface EditableLabelEntry {
	key: string;
	/** The label this entry matches on. */
	label: string;
	action: EditableAction;
}

/** A table rule: a lookup of per-label actions (no predicate). */
export interface EditableTableRule {
	kind: "table";
	key: string;
	name: string;
	description?: string;
	entries: EditableLabelEntry[];
}

export type EditableRule = EditablePredicatedRule | EditableTableRule;

/** An entity-label catalog entry. */
export interface EditableLabel {
	/** Local-only key for list rendering. */
	key: string;
	/** Stable label id (its `LabelRef`), so a scope can reference this label. */
	id: string;
	name: string;
	description?: string;
	/** comma-separated tags. */
	tags?: string;
}

/** A named set of labels a policy detects; a rule matches it via `labelInScope`. */
export interface EditableScope {
	key: string;
	name: string;
	description?: string;
	/** Label ids this scope covers. */
	labels: string[];
}

/** The full editor input for building a create/update policy payload. */
export interface PolicyInput {
	id: string;
	displayName: string;
	slug: string;
	description?: string;
	rules: EditableRule[];
	/** Catch-all action when no rule matches; null/undefined = none. */
	fallback?: EditableAction | null;
	/** Custom label schemas this policy introduces. */
	labels?: EditableLabel[];
	/** Named label sets this policy detects; rules reference them by name. */
	scopes?: EditableScope[];
}

/** Default text action used whenever an action would otherwise be empty. */
export const DEFAULT_TEXT_TEMPLATE = "[{label}]";

/** Parse a comma-separated field into trimmed, non-empty values. */
export function csvToList(csv?: string): string[] {
	return (csv ?? "")
		.split(",")
		.map((v) => v.trim())
		.filter(Boolean);
}

/** Serialize a list back to the comma-separated form the editor stores. */
export function listToCsv(list: string[]): string {
	return list.join(", ");
}
