# App icons — generated

Every file here is **generated** from the source art in `../assets/`. Do not
edit them by hand; edit the source and regenerate.

- `../assets/app-icon.svg` — the app mark (fading redaction bars, frosted tile).
  `tauri icon` turns it into the whole cross-platform set: `icon.icns` (macOS),
  `icon.ico` (Windows), the `*.png` sizes, and the `Square*Logo.png` /
  `StoreLogo.png` tiles. `tauri.conf.json` bundles the subset it needs.
- `../assets/tray-icon.svg` — the menu-bar mark (redacted lines, monochrome).
  Rendered to `trayTemplate.png` / `trayTemplate@2x.png` by the Rust **build
  script** (`build.rs`, via `resvg`) on every build, and used by `tray.rs` as a
  macOS **template** image (black + alpha; the system tints it light/dark).

## Regenerating

- **App-icon set** (`icon.icns`, `icon.ico`, PNG sizes, Store tiles) — from
  `apps/desktop`: `npm run icons` (runs `tauri icon` over `assets/app-icon.svg`).
- **Tray template** — regenerated automatically from `assets/tray-icon.svg` by
  `build.rs` on any `tauri build` / `tauri dev` / `cargo build`; edit the SVG and
  rebuild.

Commit the regenerated icons alongside any source change.
