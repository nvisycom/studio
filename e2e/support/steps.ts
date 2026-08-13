import { fileURLToPath } from "node:url";
import { type Page, expect } from "@playwright/test";
import { type TestAccount, newTestAccount } from "./account";

/** The upload fixture, resolved relative to this file so the cwd doesn't matter. */
const SAMPLE_FILE = fileURLToPath(
	new URL("../fixtures/sample.txt", import.meta.url),
);
const SAMPLE_FILE_NAME = "sample.txt";

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

/**
 * Step 3 — create a policy from a template. Uses the CCPA template, whose
 * dialog has no extra settings (HIPAA/GDPR/PCI add selects), so the happy path
 * is just: name it and create. Returns the policy's display name for later
 * steps to attach it to a pipeline.
 */
export async function createPolicyFromTemplate(
	page: Page,
	slug: string,
	name = `E2E Policy ${Date.now().toString(36)}`,
): Promise<string> {
	await page.goto(`/w/${slug}/policies/templates`);

	await page.getByTestId("policy-template-ccpa").click();
	await page.getByTestId("policy-name").fill(name);
	await page.getByTestId("policy-create").click();

	// create() redirects to the policies list (not the templates sub-route).
	await expect(page).toHaveURL(new RegExp(`/w/${slug}/policies(\\?|$)`));
	await expect(page.getByText(name, { exact: false })).toBeVisible();

	return name;
}

/**
 * Step 4 — create a pipeline and attach the given policy. Opens the create
 * sheet, names the pipeline, picks the policy in the MultiSelect (its options
 * carry role="option" labelled by the policy name), and submits. Returns the
 * pipeline name.
 */
export async function createPipeline(
	page: Page,
	slug: string,
	policyName: string,
	name = `E2E Pipeline ${Date.now().toString(36)}`,
): Promise<string> {
	await page.goto(`/w/${slug}/workflows`);

	await page.getByTestId("pipeline-create").click();
	await page.getByTestId("pipeline-name").fill(name);

	// Attach the policy: open the picker, tick the option, close it.
	await page.getByTestId("pipeline-policies").click();
	await page.getByRole("option", { name: policyName }).click();
	await page.keyboard.press("Escape");

	await page.getByTestId("pipeline-submit").click();

	// The sheet closes and the new pipeline appears in the list.
	await expect(page.getByText(name, { exact: false })).toBeVisible();

	return name;
}

/**
 * Step 5 — upload the sample file. Opens the upload dialog, sets the file on
 * the hidden input (which stages it), submits, and waits for the dialog to
 * close and the file to appear in the list. Returns the uploaded file name.
 */
export async function uploadFile(page: Page, slug: string): Promise<string> {
	await page.goto(`/w/${slug}/files`);

	await page.getByTestId("files-upload").click();
	await page.getByTestId("upload-input").setInputFiles(SAMPLE_FILE);
	await page.getByTestId("upload-submit").click();

	// On success the dialog closes and the file lists.
	await expect(page.getByTestId("upload-submit")).toBeHidden();
	await expect(
		page.getByText(SAMPLE_FILE_NAME, { exact: false }),
	).toBeVisible();

	return SAMPLE_FILE_NAME;
}
