import { expect, test } from "@playwright/test";

test.describe("Theme Toggle", () => {
	test("theme toggle is visible in footer", async ({ page }) => {
		await page.goto("/");

		const footer = page.locator("footer");
		const themeToggle = footer.locator('[data-slot="toggle-group-item"]');

		// Should have 3 toggle items (light, system, dark)
		await expect(themeToggle).toHaveCount(3);
	});

	test("can switch to dark mode", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const footer = page.locator("footer");
		const darkModeButton = footer
			.locator('[data-slot="toggle-group-item"]')
			.last();

		await expect(darkModeButton).toBeVisible();
		await darkModeButton.click({ force: true });

		await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 5000 });
	});

	test("theme is stored in localStorage", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const footer = page.locator("footer");
		const darkModeButton = footer
			.locator('[data-slot="toggle-group-item"]')
			.last();

		await expect(darkModeButton).toBeVisible();
		await darkModeButton.click({ force: true });

		await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 5000 });

		const theme = await page.evaluate(() => localStorage.getItem("theme"));
		expect(theme).toBe("dark");
	});
});
