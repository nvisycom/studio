import type { UnitBoundingBox } from "@nvisy/sdk/datatypes";

/**
 * Whether a bounding box is in valid unit space — normalized to 0..1 with a
 * top-left origin and positive size, which is the `UnitBoundingBox` contract
 * ("fraction of the medium width/height"). A tiny tolerance absorbs rounding at
 * the edges.
 *
 * Guards against upstream geometry that isn't normalized (raw points, negative
 * coordinates): such a box can't be placed on the medium, so callers treat the
 * entity as unlocatable rather than painting a box far off-page.
 */
export function isUnitRect(r: UnitBoundingBox): boolean {
	const T = 0.01;
	return (
		Number.isFinite(r.x) &&
		Number.isFinite(r.y) &&
		Number.isFinite(r.width) &&
		Number.isFinite(r.height) &&
		r.x >= -T &&
		r.y >= -T &&
		r.width > 0 &&
		r.height > 0 &&
		r.x + r.width <= 1 + T &&
		r.y + r.height <= 1 + T
	);
}
