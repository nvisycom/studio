import { expect, test } from "@playwright/test";

test.describe("404 Error Page", () => {
	test("displays 404 page for non-existent routes", async ({ page }) => {
		const response = await page.goto("/this-page-does-not-exist");

		// Should return 404 status
		expect(response?.status()).toBe(404);
	});

	test("shows error code and message", async ({ page }) => {
		await page.goto("/non-existent-page");

		// Check for 404 text
		const errorCode = page.getByText("404");
		await expect(errorCode).toBeVisible();

		// Check for error message
		const errorMessage = page.getByText("Page not found");
		await expect(errorMessage).toBeVisible();
	});

	test("has navigation buttons", async ({ page }) => {
		await page.goto("/non-existent-page");

		// Check for Go back button
		const goBackButton = page.getByRole("link", { name: /Go back/i });
		await expect(goBackButton).toBeVisible();

		// Check for Go home button
		const goHomeButton = page.getByRole("link", { name: /Go home/i });
		await expect(goHomeButton).toBeVisible();
	});

	test("home button navigates to homepage", async ({ page }) => {
		await page.goto("/non-existent-page");

		const goHomeButton = page.getByRole("link", { name: /Go home/i });
		await goHomeButton.click();

		await expect(page).toHaveURL("/");
	});

	test("has theme toggle", async ({ page }) => {
		await page.goto("/non-existent-page");

		// Check for theme toggle group
		const themeToggle = page.locator('[data-slot="toggle-group-item"]');
		await expect(themeToggle.first()).toBeVisible();
	});
});
