import type { ReviewStatus } from "@nvisy/sdk/datatypes";
import type { BadgeVariants } from "#console/components/ui/badge";

/** The review statuses in workflow order (needs review → in review → resolved). */
export const REVIEW_STATUSES: ReviewStatus[] = [
	"needs_review",
	"in_review",
	"resolved",
];

/**
 * Badge variant for a review status: neutral while awaiting review, accented
 * while in review, muted-outline once resolved. Labels come from i18n
 * (`reviews.status.<status>`), so this only maps color.
 */
export function reviewStatusVariant(
	status: ReviewStatus,
): BadgeVariants["variant"] {
	switch (status) {
		case "needs_review":
			return "secondary";
		case "in_review":
			return "default";
		case "resolved":
			return "outline";
	}
}
