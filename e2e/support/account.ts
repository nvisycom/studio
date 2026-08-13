/**
 * A fresh, unique set of signup credentials. Each E2E run creates a real
 * account on the target backend, so the identifiers must not collide between
 * runs — derive them from a timestamp + random suffix.
 *
 * `Date.now()` is fine here (unlike in workflow scripts): this runs in the
 * Playwright test process, not a resumable workflow.
 */
export interface TestAccount {
	username: string;
	email: string;
	password: string;
}

export function newTestAccount(): TestAccount {
	const suffix = `${Date.now().toString(36)}${Math.random()
		.toString(36)
		.slice(2, 6)}`;
	return {
		// Username rule (matches signup): lowercase alphanumeric + single dashes.
		username: `e2e-${suffix}`,
		email: `e2e-${suffix}@example.com`,
		password: "Test-Password-123",
	};
}
