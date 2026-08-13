import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the full happy-path E2E flow (signup → workspace →
 * policy → pipeline → upload → run).
 *
 * This is a LIVE end-to-end test: it drives the web app against a real backend.
 * Point it at a local stack — the web dev server on :3000 talking to the API on
 * 127.0.0.1:8080 — never production (each run creates a real account).
 *
 * - BASE_URL overrides the app URL (default http://localhost:3000).
 * - Set PW_NO_SERVER=1 to reuse an app you already have running instead of
 *   letting Playwright start `npm run dev`.
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
	testDir: "./e2e",
	// One run creates real backend state, so keep the flow serial and give the
	// async pipeline run room to finish.
	fullyParallel: false,
	workers: 1,
	retries: 0,
	timeout: 120_000,
	expect: { timeout: 15_000 },
	reporter: [["list"], ["html", { open: "never" }]],
	use: {
		baseURL: BASE_URL,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				// SLOWMO=<ms> paces actions when watching a headed run.
				launchOptions: { slowMo: Number(process.env.SLOWMO ?? 0) },
			},
		},
	],
	webServer: process.env.PW_NO_SERVER
		? undefined
		: {
				command: "npm run dev",
				url: BASE_URL,
				reuseExistingServer: true,
				timeout: 120_000,
			},
});
