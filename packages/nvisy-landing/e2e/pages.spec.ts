import { expect, test } from "@playwright/test";

const pages = [
	{ path: "/", title: /Nvisy/ },
	{ path: "/about", title: /About/ },
	{ path: "/pricing", title: /Pricing/ },
	{ path: "/customers", title: /Customers/ },
	{ path: "/blog", title: /Blog/ },
	{ path: "/legal", title: /Legal/ },
	{ path: "/products/server", title: /Server/ },
	{ path: "/products/studio", title: /Studio/ },
];

test.describe("Pages Load Successfully", () => {
	for (const { path, title } of pages) {
		test(`${path} loads without errors`, async ({ page }) => {
			const errors: string[] = [];
			page.on("pageerror", (error) => errors.push(error.message));

			const response = await page.goto(path);

			// Check for successful response
			expect(response?.status()).toBeLessThan(400);

			// Check title matches expected pattern
			await expect(page).toHaveTitle(title);

			// Ensure no JavaScript errors occurred
			expect(errors).toHaveLength(0);
		});
	}
});

test.describe("Page Structure", () => {
	for (const { path } of pages) {
		test(`${path} has exactly one header and one footer`, async ({ page }) => {
			await page.goto(path);

			const header = page.locator("header");
			const footer = page.locator("footer");

			// Should have exactly one of each
			await expect(header).toHaveCount(1);
			await expect(footer).toHaveCount(1);

			// Both should be visible
			await expect(header).toBeVisible();
			await expect(footer).toBeVisible();
		});
	}
});
