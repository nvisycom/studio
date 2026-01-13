import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
	test("loads successfully with correct title", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/Nvisy/);
	});

	test("displays hero section", async ({ page }) => {
		await page.goto("/");
		const hero = page.locator("section").first();
		await expect(hero).toBeVisible();
	});

	test("displays navigation header", async ({ page }) => {
		await page.goto("/");
		const header = page.locator("header");
		await expect(header).toBeVisible();
		// Should only have one header element
		await expect(header).toHaveCount(1);
	});

	test("displays footer", async ({ page }) => {
		await page.goto("/");
		const footer = page.locator("footer");
		await expect(footer).toBeVisible();
		// Should only have one footer element
		await expect(footer).toHaveCount(1);
	});
});
