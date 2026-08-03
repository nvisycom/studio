import { NvisyApiError } from "@nvisy/sdk";

/**
 * Resolve a user-facing message from an unknown thrown value, falling back to
 * the provided default for non-Error rejections.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
	if (err instanceof NvisyApiError) {
		return err.message;
	}
	if (err instanceof Error) {
		return err.message;
	}
	return fallback;
}
