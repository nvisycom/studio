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

/**
 * Whether a thrown value is the API's "payload too large" (HTTP 413) — the
 * server rejecting an upload over its size cap. The authoritative check behind
 * the client's own soft pre-check, which can be stale or absent.
 */
export function isPayloadTooLarge(err: unknown): boolean {
	return err instanceof NvisyApiError && err.statusCode === 413;
}
