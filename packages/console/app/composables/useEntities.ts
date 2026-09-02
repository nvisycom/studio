import type {
	ImageEntity,
	TabularEntity,
	TextEntity,
} from "@nvisy/sdk/datatypes";

/**
 * Shared entity model across modalities (text, tabular, image, audio). A detected
 * entity has a modality-agnostic core — identity, label/category, provenance,
 * reviewer state — plus a modality-specific *location* (byte offsets for text, a
 * cell for tabular, a bounding box for image). This module holds the common core
 * and the grouping/clustering the audit list builds, parameterized so each
 * modality's view type (see {@link useTextEntities}, {@link useImageEntities})
 * reuses them without duplicating the logic.
 */

/**
 * The modality-agnostic fields every entity view carries. Each modality's view
 * extends this with its own location shape (text: byte offsets; image: a box).
 */
export interface BaseEntityView {
	/** Stable entity id (UUIDv7 from recognition). */
	id: string;
	/** Raw label id (e.g. "person", "email_address"). */
	label: string;
	/** The label's catalog category (e.g. "contact", "financial"), or null when
	 * the catalog doesn't know the label. Drives the highlight color per category. */
	category: string | null;
	/** Effective confidence, 0..1. */
	confidence: number;
	/** Recognizer/source that first found this entity (the birth event). */
	source?: string;
	/** The specific pattern/model that matched (e.g. "ssn", "gpt-4"), when the
	 * birth event was a pattern/model recognition. */
	detector?: string;
	/** Whether {@link detector} names a regex pattern or an ML model. */
	detectorKind?: "pattern" | "model";
	/** Detected language of the surrounding text, when known (e.g. "en"). */
	language?: string;
	/** The matched value, when available (sliced from the document / OCR text).
	 * Absent for entities with no text form. */
	text?: string;
	/** Whether a reviewer kept (suppressed) this entity out of the redaction. */
	suppressed?: boolean;
	/** Whether the reviewer added this entity by hand (vs. detected). */
	added?: boolean;
}

/** Any SDK entity that carries the shared provenance fields (`audit`, `language`). */
type ProvenancedEntity = TextEntity | TabularEntity | ImageEntity;

/**
 * Provenance/language shared by every modality's entities: the birth event's
 * source and, when it was a pattern/model recognition, the specific detector.
 */
export function provenance(entity: ProvenancedEntity) {
	// The birth event is the detection with no parents; fall back to the first.
	const birth =
		entity.audit.find((ev) => ev.parents.length === 0) ?? entity.audit[0];

	// Prefer the specific pattern/model name from the birth event's detail. The
	// detail is typed per kind, so narrow on `kind.kind` before reading it.
	const kind = birth?.kind;
	let detector: string | undefined;
	let detectorKind: "pattern" | "model" | undefined;
	if (kind?.kind === "pattern") {
		detector = kind.detail.pattern.name;
		detectorKind = "pattern";
	} else if (kind?.kind === "model") {
		detector = kind.detail.model.name;
		detectorKind = "model";
	}

	return {
		source: birth?.source,
		detector,
		detectorKind,
		language: entity.language,
	};
}

/**
 * A run of identical occurrences within one label group — same matched value +
 * detector, differing only by location. `lead` is the representative (first in
 * order); `items` holds every occurrence, so the UI can collapse them to one row
 * with a count and step through the locations.
 */
export interface EntityCluster<T extends BaseEntityView> {
	/** Stable identity for the cluster (the dedup key). */
	key: string;
	/** The representative occurrence (first in order). */
	lead: T;
	/** Every occurrence, in order. */
	items: T[];
}

/** One label's entities within a category: its display name, items, clusters. */
export interface LabelGroup<T extends BaseEntityView> {
	/** Raw label id. */
	label: string;
	/** Catalog display name (falls back to the id). */
	name: string;
	/** Every occurrence for this label, in order. */
	items: T[];
	/** Occurrences clustered by identical value + detector. */
	clusters: EntityCluster<T>[];
}

/** A category section of the audit list: its label groups and total count. */
export interface CategorizedGroup<T extends BaseEntityView> {
	/** Catalog category, or null for labels the catalog doesn't know. */
	category: string | null;
	/** Total entities under this category. */
	count: number;
	/** The label groups in this category. */
	labels: LabelGroup<T>[];
}

/** Group a flat entity list by raw label id, preserving order. */
export function groupByLabel<T extends BaseEntityView>(
	entities: T[],
): { label: string; items: T[] }[] {
	const map = new Map<string, T[]>();
	for (const entity of entities) {
		const list = map.get(entity.label);
		if (list) list.push(entity);
		else map.set(entity.label, [entity]);
	}
	return Array.from(map, ([label, items]) => ({ label, items }));
}

/**
 * Cluster a label group's entities by identical value + detector, preserving
 * order. Entities that differ only by location (the same value found many times)
 * collapse into one cluster carrying every occurrence, so the UI can show one row
 * with a count + prev/next. `clusterKey` supplies the modality-specific tail of
 * the dedup key (a byte span for text, a box for image) so distinct locations of
 * the same value stay distinct when the value alone would collide.
 */
export function clusterItems<T extends BaseEntityView>(
	items: T[],
	clusterKey: (item: T) => string,
): EntityCluster<T>[] {
	const map = new Map<string, EntityCluster<T>>();
	const order: string[] = [];
	for (const item of items) {
		const value = item.text ?? "";
		const detector = item.detector ?? item.source ?? "";
		const key = `${value} ${detector} ${clusterKey(item)}`;
		const existing = map.get(key);
		if (existing) existing.items.push(item);
		else {
			map.set(key, { key, lead: item, items: [item] });
			order.push(key);
		}
	}
	// biome-ignore lint/style/noNonNullAssertion: keys come straight from the map.
	return order.map((k) => map.get(k)!);
}

/**
 * Two-tier grouping for the audit list: entities grouped by label, then those
 * label groups clustered under their catalog category. A label with no category
 * lands under a null category ("Uncategorized"). Label groups keep the incoming
 * order; categories are sorted by name, uncategorized last. `labelName` resolves
 * a label id to its display name; `clusterKey` is passed through to
 * {@link clusterItems}.
 */
export function categorize<T extends BaseEntityView>(
	entities: T[],
	labelName: (label: string) => string,
	clusterKey: (item: T) => string,
): CategorizedGroup<T>[] {
	const byCategory = new Map<string | null, LabelGroup<T>[]>();

	for (const group of groupByLabel(entities)) {
		// Every entity in a label group shares its category (label -> category).
		const category = group.items[0]?.category ?? null;
		const enriched: LabelGroup<T> = {
			label: group.label,
			name: labelName(group.label),
			items: group.items,
			clusters: clusterItems(group.items, clusterKey),
		};
		const bucket = byCategory.get(category);
		if (bucket) bucket.push(enriched);
		else byCategory.set(category, [enriched]);
	}

	return Array.from(byCategory, ([category, labels]) => ({
		category,
		count: labels.reduce((n, l) => n + l.items.length, 0),
		labels,
	})).sort((a, b) => {
		if (a.category === null) return 1;
		if (b.category === null) return -1;
		return a.category.localeCompare(b.category);
	});
}
