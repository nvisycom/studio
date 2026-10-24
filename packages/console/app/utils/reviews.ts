import type { ReviewStatus } from "@nvisy/sdk/datatypes";
import type { BadgeVariants } from "#console/components/ui/badge";

/** The review statuses in approval-workflow order (draft → in review →
 *  changes requested / partially approved → approved). */
export const REVIEW_STATUSES: ReviewStatus[] = [
	"draft",
	"in_review",
	"changes_requested",
	"partially_approved",
	"approved",
];

/**
 * Badge variant for a review status: muted while a draft, accented while in
 * review, destructive when changes are requested, and a filled badge once
 * (partially) approved. Labels come from i18n (`reviews.status.<status>`), so
 * this only maps color.
 */
export function reviewStatusVariant(
	status: ReviewStatus,
): BadgeVariants["variant"] {
	switch (status) {
		case "draft":
			return "outline";
		case "in_review":
			return "default";
		case "changes_requested":
			return "destructive";
		case "partially_approved":
			return "secondary";
		case "approved":
			return "secondary";
	}
}
