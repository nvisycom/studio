# Contributing

Thank you for your interest in contributing to the Nvisy console.

## Prerequisites

- [Node.js](https://nodejs.org/) 24+
- [npm](https://www.npmjs.com/) 10+
- [Make](https://www.gnu.org/software/make/) (included on macOS/Linux)
- [Rust](https://www.rust-lang.org/) + Cargo (desktop app only)

## Setup

```bash
git clone https://github.com/nvisycom/studio.git
cd studio
make install
```

## Development

```bash
npm run dev -w @nvisy/webapp           # Web app (http://localhost:3000)
npm run dev -w @nvisy/desktop          # Desktop frontend (http://localhost:1420)
npm run tauri -w @nvisy/desktop dev    # Desktop app in a Tauri window
```

The web app defaults to the self-hosted edition; use `npm run dev:cloud` to run
the cloud edition locally (see [Editions & feature flags](#editions--feature-flags)).

## Project Structure

```
packages/console/   # shared Nuxt layer (design system, features, data layer)
apps/web/           # web shell
apps/desktop/       # desktop shell + tauri/
```

Shared code lives in `@nvisy/console` and is imported via the `#console` alias.
Each app's `@/` points at its own `app/` directory. New shared components go in
`packages/console`; app-specific routes/shell go in the respective app.

## Code Quality

```bash
make check          # Lint and format (Biome) — tauri/ is excluded
npm run typecheck   # Type check all workspaces
```

Do not run Biome on `tauri/` — Rust and Tauri config files are managed by
the Rust toolchain.

## Build

```bash
make build          # Web app (self-hosted edition) -> output/
make build-cloud    # Web app (cloud edition, app.nvisy.com) -> output/
make build-desktop  # Desktop frontend
```

If things break after pulling changes:

```bash
make repair         # Clean and reinstall dependencies
```

## Editions & feature flags

The web app ships in two editions, selected at build time by the
`NUXT_PUBLIC_DEPLOYMENT` environment variable:

- **`cloud`** — the SaaS build (app.nvisy.com). Enables cloud-only features.
- **self-hosted** (the default when the variable is unset) — everything except
  the cloud-only features.

Cloud-only features are gated off unless `NUXT_PUBLIC_DEPLOYMENT=cloud`. The
default-off allowlist means a missing or misconfigured flag never exposes a
SaaS-only surface on a self-hosted install.

Run or build the cloud edition locally with the `:cloud` scripts:

```bash
npm run dev:cloud       # Web dev server, cloud edition
npm run build:cloud     # Web build, cloud edition
```

The desktop app never sets the flag, so it always gets the self-hosted feature
set.

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Run `make check` and `npm run typecheck`
4. Push and open a PR against `main`

CI will run lint, type checks (all workspaces), and a production build.
