#!/usr/bin/env node
/**
 * Detect (and optionally remove) unused i18n keys.
 *
 * Flattens every key in the locale JSON to a dot-path, scans all `.vue`/`.ts`
 * source, and flags paths that are referenced neither as a literal
 * `t("a.b.c")` nor as a dynamic key `t(`a.b.${x}`)` / `t(`${x}.c`)`. The
 * dynamic-prefix handling is what keeps runtime-built keys (e.g.
 * `policies.templates.${kind}.name`) from being reported as unused.
 *
 * Usage:
 *   node scripts/i18n-unused.mjs          # report unused keys
 *   node scripts/i18n-unused.mjs --fix    # remove them from every locale file
 *
 * Note: this is a heuristic. A key assembled from a variable in an unusual way
 * could be a false positive, and keys consumed outside the scanned dirs aren't
 * seen. Review the list before running --fix.
 */
import fs from "node:fs";
import path from "node:path";

const LOCALE_DIR = "packages/console/i18n/locales";
const SOURCE_ROOTS = ["apps/web/app", "packages/console/app"];
// The reference locale whose keys define the canonical set.
const REFERENCE_LOCALE = "en.json";

const fix = process.argv.includes("--fix");

// Collect keys from the reference locale
const referencePath = path.join(LOCALE_DIR, REFERENCE_LOCALE);
const reference = JSON.parse(fs.readFileSync(referencePath, "utf8"));

/** Flatten an object into leaf dot-paths. */
function flatten(obj, prefix = "") {
	const out = [];
	for (const [k, v] of Object.entries(obj)) {
		const p = prefix ? `${prefix}.${k}` : k;
		if (v && typeof v === "object" && !Array.isArray(v))
			out.push(...flatten(v, p));
		else out.push(p);
	}
	return out;
}
const keys = flatten(reference);

// Read all source
const source = [];
function readDir(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === "node_modules" || entry.name === ".nuxt") continue;
		const fp = path.join(dir, entry.name);
		if (entry.isDirectory()) readDir(fp);
		else if (/\.(vue|ts)$/.test(entry.name))
			source.push(fs.readFileSync(fp, "utf8"));
	}
}
for (const root of SOURCE_ROOTS) if (fs.existsSync(root)) readDir(root);
const src = source.join("\n");

/** A key is used if its full path, or a dynamic prefix/suffix of it, appears. */
function isUsed(key) {
	if (src.includes(key)) return true;
	const parts = key.split(".");
	for (let i = parts.length - 1; i >= 1; i--) {
		const prefix = parts.slice(0, i).join(".");
		if (src.includes(`${prefix}.\${`)) return true; // `prefix.${x}...`
		if (src.includes(`}.${parts[i]}`)) return true; // `${x}.segment`
	}
	return false;
}

const unused = keys.filter((k) => !isUsed(k));

console.log(`Locale keys (${REFERENCE_LOCALE}): ${keys.length}`);
console.log(`Unused candidates: ${unused.length}`);
if (unused.length) console.log(`\n${unused.join("\n")}`);

if (!fix) {
	if (unused.length)
		console.log("\nRun with --fix to remove these from every locale file.");
	process.exit(0);
}

// Remove unused keys from every locale file
function deletePath(obj, key) {
	const parts = key.split(".");
	const leaf = parts.pop();
	let node = obj;
	for (const p of parts) {
		if (!node || typeof node !== "object") return;
		node = node[p];
	}
	if (node && typeof node === "object") delete node[leaf];
}
/** Recursively drop now-empty objects. */
function prune(obj) {
	for (const [k, v] of Object.entries(obj)) {
		if (v && typeof v === "object" && !Array.isArray(v)) {
			prune(v);
			if (Object.keys(v).length === 0) delete obj[k];
		}
	}
}

const localeFiles = fs
	.readdirSync(LOCALE_DIR)
	.filter((f) => f.endsWith(".json"));
for (const file of localeFiles) {
	const fp = path.join(LOCALE_DIR, file);
	const data = JSON.parse(fs.readFileSync(fp, "utf8"));
	for (const key of unused) deletePath(data, key);
	prune(data);
	fs.writeFileSync(fp, `${JSON.stringify(data, null, "\t")}\n`);
}
console.log(
	`\nRemoved ${unused.length} keys from ${localeFiles.length} locale files.`,
);
