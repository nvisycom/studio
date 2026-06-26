# Contributing

Thank you for your interest in contributing to the Nvisy console.

## Prerequisites

- [Node.js](https://nodejs.org/) 22.18+
- [npm](https://www.npmjs.com/) 10+
- [Make](https://www.gnu.org/software/make/) (included on macOS/Linux)
- [Rust](https://www.rust-lang.org/) + Cargo (desktop app only)

## Setup

```bash
git clone https://github.com/nvisycom/portal.git
cd portal
make install
```

## Development

```bash
npm run dev -w @nvisy/webapp           # Web app (http://localhost:3000)
npm run dev -w @nvisy/desktop          # Desktop frontend (http://localhost:1420)
npm run tauri -w @nvisy/desktop dev    # Desktop app in a Tauri window
```

## Project Structure

```
packages/console/   # shared Nuxt layer (design system, features, data layer)
apps/web/           # web shell
apps/desktop/       # desktop shell + src-tauri/
```

Shared code lives in `@nvisy/console` and is imported via the `#console` alias.
Each app's `@/` points at its own `app/` directory. New shared components go in
`packages/console`; app-specific routes/shell go in the respective app.

## Code Quality

```bash
make check          # Lint and format (Biome) — src-tauri/ is excluded
npm run typecheck   # Type check all workspaces
```

Do not run Biome on `src-tauri/` — Rust and Tauri config files are managed by
the Rust toolchain.

## Build

```bash
make build          # Web app -> output/
make build-desktop  # Desktop frontend
```

If things break after pulling changes:

```bash
make repair         # Clean and reinstall dependencies
```

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Run `make check` and `npm run typecheck`
4. Push and open a PR against `main`

CI will run lint, type checks (all workspaces), and a production build.
