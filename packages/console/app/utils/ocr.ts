import type { OcrPolicy } from "@nvisy/sdk/datatypes";

/** OCR policy options, in display order (Always / Automatic / Never). */
export const OCR_POLICIES: OcrPolicy[] = ["force", "auto", "never"];
