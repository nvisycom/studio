import { expect, test } from "@playwright/test";
import { newTestAccount } from "./support/account";

/**
 * Step 1 of the happy-path flow: sign up a brand-new account.
 *
 * Live test — it creates a real account on the target backend (keep it pointed
 * at a local stack, never production). On success the app navigates to "/",
 * which for a fresh account with no workspace resolves to the onboarding
 * screen; we assert that as the signed-in landing state.
 */
test("a new account can sign up", async ({ page }) => {
	const account = newTestAccount();

	await page.goto("/auth/signup");

	await page.getByTestId("signup-username").fill(account.username);
	await page.getByTestId("signup-email").fill(account.email);
	await page.getByTestId("signup-password").fill(account.password);
	await page.getByTestId("signup-terms").click();

	await page.getByTestId("signup-submit").click();

	// Signed in: the URL leaves /auth/signup and the fresh-account onboarding
	// (create-first-workspace) screen is shown.
	await expect(page).not.toHaveURL(/\/auth\/signup/);
	await expect(page.getByTestId("onboarding-create-workspace")).toBeVisible();
});
