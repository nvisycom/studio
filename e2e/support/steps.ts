import { type Page, expect } from "@playwright/test";
import { type TestAccount, newTestAccount } from "./account";

/**
 * Reusable happy-path steps, each driving one stage of the flow and asserting
 * it landed. They're composed by the end-to-end spec and share the same `page`
 * so state (auth, active workspace) carries across steps.
 */

/** Step 1 — sign up a fresh account; lands on the onboarding screen. */
export async function signUp(page: Page): Promise<TestAccount> {
	const account = newTestAccount();

	await page.goto("/auth/signup");
	await page.getByTestId("signup-username").fill(account.username);
	await page.getByTestId("signup-email").fill(account.email);
	await page.getByTestId("signup-password").fill(account.password);
	await page.getByTestId("signup-terms").click();
	await page.getByTestId("signup-submit").click();

	await expect(page).not.toHaveURL(/\/auth\/signup/);
	await expect(page.getByTestId("onboarding-create-workspace")).toBeVisible();

	return account;
}

/**
 * Step 2 — create the first workspace from the onboarding screen. Returns the
 * workspace slug (derived from the name), which the URL becomes on success.
 */
export async function createWorkspace(
	page: Page,
	name = `E2E Workspace ${Date.now().toString(36)}`,
): Promise<string> {
	await page.getByTestId("onboarding-create-workspace").click();

	// The slug the backend will assign is the one the form derives client-side.
	const nameInput = page.getByTestId("workspace-name");
	await nameInput.fill(name);
	const slug = await page.locator("#workspace-slug").inputValue();
	expect(slug).not.toEqual("");

	await page.getByTestId("workspace-submit").click();

	// On success the app navigates to the new workspace overview, /w/{slug}.
	await expect(page).toHaveURL(new RegExp(`/w/${slug}(/|$)`));
	return slug;
}
