import { expect, test } from "@playwright/test";

test.describe("Desktop Navigation", () => {
	test.use({ viewport: { width: 1280, height: 720 } });

	test("header contains logo link to home", async ({ page }) => {
		await page.goto("/about");

		const logoLink = page.locator('header a[href="/"]');
		await expect(logoLink).toBeVisible();

		await logoLink.click();
		await expect(page).toHaveURL("/");
	});

	test("navigation menu is visible", async ({ page }) => {
		await page.goto("/");

		const nav = page.locator("header nav");
		await expect(nav).toBeVisible();
	});

	test("can navigate to pricing page", async ({ page }) => {
		await page.goto("/");

		const pricingLink = page.locator('header a[href="/pricing"]');
		await expect(pricingLink).toBeVisible();
		await pricingLink.click();

		await expect(page).toHaveURL("/pricing");
		await expect(page).toHaveTitle(/Pricing/);
	});
});

test.describe("Mobile Navigation", () => {
	test.use({ viewport: { width: 375, height: 667 } });

	test("mobile navigation is accessible", async ({ page }) => {
		await page.goto("/");

		const header = page.locator("header");
		await expect(header).toBeVisible();

		// Check that the header contains at least a logo/home link
		const homeLink = header.locator('a[href="/"]').first();
		await expect(homeLink).toBeVisible();
	});
});

test.describe("Footer Navigation", () => {
	test("footer contains important links", async ({ page }) => {
		await page.goto("/");

		const footer = page.locator("footer");
		const legalLinks = footer.locator('a[href*="legal"]');
		await expect(legalLinks.first()).toBeVisible();
	});

	test("can navigate to legal page from footer", async ({ page }) => {
		await page.goto("/");

		const footer = page.locator("footer");
		const legalLink = footer.locator('a[href*="legal"]').first();
		await legalLink.click();

		await expect(page).toHaveURL(/legal/);
	});
});
