#!/usr/bin/env node
/**
 * Generate the desktop app icons from the source SVGs in `tauri/assets/`.
 *
 * Two corner treatments, because the platforms differ:
 *  - macOS masks the dock/Finder icon itself (a squircle), so the `.icns` must
 *    be the FULL-BLEED SQUARE art — a pre-rounded icon would double-round under
 *    the system mask.
 *  - Windows and Linux do NOT mask, so their `.ico` / PNG icons get the
 *    squircle baked in, for rounded corners in the taskbar / launcher.
 *  - The README logo also gets the squircle (it renders raw).
 *
 * So: run `tauri icon` once on the square source (keeps the right `.icns`),
 * then overwrite the non-macOS raster outputs + the `.ico` with versions
 * rendered from the rounded source, and render the README logo from it too.
 *
 * Requirements: the Tauri CLI (a workspace dep) and `rsvg-convert` (librsvg,
 * `brew install librsvg`). Run from the repo root: `npm run icons -w @nvisy/desktop`.
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const desktop = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(desktop, "tauri", "assets");
const icons = join(desktop, "tauri", "icons");
const repoRoot = resolve(desktop, "..", "..");
const readmeLogo = join(repoRoot, ".github", "assets", "logo.png");

const SQUARE = join(assets, "app-icon.svg");
const ROUNDED = join(assets, "app-icon-rounded.svg");

/** The Tauri CLI, resolved from the workspace. */
const tauri = join(repoRoot, "node_modules", ".bin", "tauri");

/** The raster outputs whose corners Windows/Linux show (everything but .icns). */
const ROUNDED_OUTPUTS = [
	"32x32.png",
	"64x64.png",
	"128x128.png",
	"128x128@2x.png",
	"icon.png",
	"icon.ico",
	"Square30x30Logo.png",
	"Square44x44Logo.png",
	"Square71x71Logo.png",
	"Square89x89Logo.png",
	"Square107x107Logo.png",
	"Square142x142Logo.png",
	"Square150x150Logo.png",
	"Square284x284Logo.png",
	"Square310x310Logo.png",
	"StoreLogo.png",
];

function run(cmd, args) {
	execFileSync(cmd, args, { stdio: "inherit" });
}

function main() {
	// 1. Full set from the SQUARE source — this gives macOS the right .icns.
	console.log("→ tauri icon (square source, for the macOS .icns)");
	run(tauri, ["icon", SQUARE, "-o", icons]);

	// 2. Full set from the ROUNDED source into a temp dir, then copy its
	//    non-macOS outputs over the square ones (keeping the square .icns).
	const tmp = mkdtempSync(join(tmpdir(), "nvisy-icons-"));
	try {
		console.log("→ tauri icon (rounded source, for Windows/Linux)");
		run(tauri, ["icon", ROUNDED, "-o", tmp]);
		for (const name of ROUNDED_OUTPUTS) {
			cpSync(join(tmp, name), join(icons, name));
		}
		console.log(`→ overwrote ${ROUNDED_OUTPUTS.length} rounded raster outputs`);
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}

	// 3. README logo from the rounded source (renders raw, so it needs rounding).
	console.log("→ rsvg-convert README logo (rounded)");
	run("rsvg-convert", ["-w", "256", "-h", "256", ROUNDED, "-o", readmeLogo]);

	console.log("✓ icons generated");
}

main();
