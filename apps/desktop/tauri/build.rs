// https://doc.rust-lang.org/cargo/reference/build-scripts.html

use anyhow::{Context, Result};
use resvg::tiny_skia::Pixmap;
use resvg::usvg::{Options, Transform, Tree};

fn main() -> Result<()> {
    render_tray_template()?;
    tauri_build::build();
    Ok(())
}

/// Source SVG for the menu-bar mark ("redacted lines"). Monochrome (black +
/// alpha) so macOS can tint it to the menu bar; `tray.rs` loads the rendered
/// `trayTemplate.png` as a template image.
const TRAY_SVG: &str = "assets/tray-icon.svg";

/// Rasterize the tray SVG into its template PNGs from a single vector source, so
/// the tray icon is generated rather than committed by hand. A failure fails the
/// build, so a broken source can't ship a stale icon. Emits @1x (menu-bar
/// points) and @2x (Retina).
fn render_tray_template() -> Result<()> {
    println!("cargo:rerun-if-changed={TRAY_SVG}");

    let tree = TrayAsset::load_tree()?;
    TrayAsset::new("icons/trayTemplate.png", 44).render(&tree)?;
    TrayAsset::new("icons/trayTemplate@2x.png", 88).render(&tree)?;
    Ok(())
}

/// One rendered tray asset: the output path and its square pixel size.
struct TrayAsset {
    path: &'static str,
    size: u32,
}

impl TrayAsset {
    /// Load and parse the shared tray SVG source into a render tree.
    fn load_tree() -> Result<Tree> {
        let svg = std::fs::read_to_string(TRAY_SVG).with_context(|| format!("read {TRAY_SVG}"))?;
        Tree::from_str(&svg, &Options::default()).with_context(|| format!("parse {TRAY_SVG}"))
    }

    /// A tray asset at `path`, rendered `size`×`size` pixels.
    fn new(path: &'static str, size: u32) -> Self {
        Self { path, size }
    }

    /// Render `tree` to this asset's square PNG, scaling the (square) source
    /// viewBox uniformly to fit.
    fn render(&self, tree: &Tree) -> Result<()> {
        let mut pixmap = Pixmap::new(self.size, self.size)
            .with_context(|| format!("allocate {}px pixmap for {}", self.size, self.path))?;
        let scale = self.size as f32 / tree.size().width();
        let transform = Transform::from_scale(scale, scale);
        resvg::render(tree, transform, &mut pixmap.as_mut());
        pixmap
            .save_png(self.path)
            .with_context(|| format!("write {}", self.path))
    }
}
