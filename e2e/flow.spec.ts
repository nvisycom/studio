import { test } from "@playwright/test";
import {
	createPolicyFromTemplate,
	createWorkspace,
	signUp,
} from "./support/steps";

/**
 * The end-to-end happy path, built up one step at a time:
 * signup → workspace → policy → pipeline → upload → run.
 *
 * Live test — each step creates real state on the target backend, so keep it
 * pointed at a local stack (:8080), never production. Steps run in sequence in
 * a single browser context because each depends on the previous one's state
 * (auth, then the active workspace, ...).
 */
test("happy path: signup through pipeline run", async ({ page }) => {
	// Step 1 — signup.
	await signUp(page);

	// Step 2 — create the first workspace.
	const slug = await createWorkspace(page);

	// Step 3 — create a policy from a template.
	await createPolicyFromTemplate(page, slug);
});
