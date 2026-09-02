import type { Layout } from "@nvisy/sdk/datatypes";
import type { ImageBox } from "#console/composables/useImageEntities";

/**
 * OCR layout for the image preview's optional overlay: the recognized blocks,
 * each with its bounding box in the image's natural pixel coordinates. Derived
 * from the detection's `image` intermediate ({@link Layout}) — optional, like the
 * audio transcript: a detection with no OCR enricher has none.
 */
export interface ImageLayout {
	/** Recognized blocks, each a box + its text. */
	blocks: ImageLayoutBlock[];
}

export interface ImageLayoutBlock {
	/** Bounding box in natural pixel coordinates. */
	box: ImageBox;
	/** Recognized text for the block. */
	text: string;
}

/**
 * Map an SDK OCR {@link Layout} to the preview's {@link ImageLayout}, or null when
 * absent. Only blocks with a box are kept.
 */
export function toImageLayout(
	layout: Layout | null | undefined,
): ImageLayout | null {
	if (!layout) return null;
	const blocks: ImageLayoutBlock[] = layout.blocks.map((b) => {
		const bbox = b.region.bounding_box;
		return {
			box: {
				minX: bbox.min.x,
				minY: bbox.min.y,
				maxX: bbox.max.x,
				maxY: bbox.max.y,
			},
			text: b.text,
		};
	});
	return { blocks };
}
