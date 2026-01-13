import { defineConfig, devices } from "@playwright/test";

// Flag to indicate if running in CI.
const withCI = !!process.env.CI;

// https://playwright.dev/docs/test-configuration
export default defineConfig({
	testDir: "./e2e",
	testMatch: ["**/*.spec.ts", "**/*.test.ts"],
	// Maximum time one test can run for.
	timeout: 30 * 1000,
	expect: {
		// Maximum time expect() should wait for the condition to be met.
		timeout: 5 * 1000,
	},

	// Shared settings for all the projects below.
	// See https://playwright.dev/docs/api/class-testoptions.
	use: {
		// Maximum time each action such as `click()` can take.
		actionTimeout: 0,
		// Base URL to use in actions e.g. `await page.goto('/')`.
		baseURL: "http://localhost:4321",
		// Collect trace when retrying the failed test.
		// See https://playwright.dev/docs/trace-viewer
		trace: "on-first-retry",
	},

	// Configure projects for major browsers.
	projects: [
		// Test against desktop viewports.
		{
			name: "Desktop Chrome",
			use: {
				...devices["Desktop Chrome"],
			},
		},
		{
			name: "Desktop Firefox",
			use: {
				...devices["Desktop Firefox"],
			},
		},
		{
			name: "Desktop Safari",
			use: {
				...devices["Desktop Safari"],
			},
		},

		// Test against mobile viewports.
		{
			name: "Mobile Chrome",
			use: {
				...devices["Pixel 5"],
			},
		},
		{
			name: "Mobile Safari",
			use: {
				...devices["iPhone 12"],
			},
		},
	],

	// Folder for test artifacts such as screenshots, videos, traces, etc.
	outputDir: "test-results/",

	// Runs your local dev server before starting the tests.
	webServer: {
		// Use the dev server by default for faster feedback loop.
		// Use the preview server on CI for more realistic testing.
		// Playwright will re-use the local server if there is already a dev-server running.
		command: withCI ? "npm run preview" : "npm run dev",
		port: 4321,
		reuseExistingServer: !withCI,
	},
});
