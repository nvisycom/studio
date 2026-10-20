# App icons — generated

Every file here is **generated** from the source art in `../assets/`. Do not
edit them by hand; edit the source and regenerate.

- `../assets/app-icon.svg` — the app mark (the dissolving dots, glowing on a
  dark tile), **full-bleed square**. This is the macOS source: macOS masks the
  dock icon with its own squircle, so `icon.icns` must stay square (a pre-rounded
  icon would double-round under the system mask).
- `../assets/app-icon-rounded.svg` — the same art clipped to the Apple-style
  **squircle** (the macOS / Linear corner shape). Windows and Linux don't mask,
  so their `icon.ico` / `*.png` / `Square*` / `StoreLogo` icons are rendered from
  this, and so is the repo's `.github/assets/logo.png` (it renders raw).
- `../assets/tray-icon.svg` — the menu-bar mark (the dissolving dots, monochrome).
  Rendered to `trayTemplate.png` / `trayTemplate@2x.png` by the Rust **build
  script** (`build.rs`, via `resvg`) on every build, and used by `tray.rs` as a
  macOS **template** image (black + alpha; the system tints it light/dark).

## Regenerating

- **App-icon set + README logo** — from `apps/desktop`: `npm run icons` (the
  `scripts/icons.mjs` generator: square `.icns` for macOS, squircle `.ico`/PNGs
  for Windows/Linux, and the rounded README logo). Needs the Tauri CLI and
  `rsvg-convert` (librsvg).
- **Tray template** — regenerated automatically from `assets/tray-icon.svg` by
  `build.rs` on any `tauri build` / `tauri dev` / `cargo build`; edit the SVG and
  rebuild.

Commit the regenerated icons alongside any source change.
