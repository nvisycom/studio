# Contributing

Thank you for your interest in contributing to Nvisy Portal.

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [npm](https://www.npmjs.com/) 10+
- [Make](https://www.gnu.org/software/make/) (included on macOS/Linux)

## Setup

```bash
# Clone the repository
git clone https://github.com/nvisycom/portal.git
cd portal

# Install dependencies
make install

# Build shared libraries (required before running packages)
make build-deps
```

## Development

```bash
# Landing page (nvisy.com)
npm run dev --workspace=@nvisy/landing    # http://localhost:4321

# Web application (app.nvisy.com)
npm run dev --workspace=@nvisy/webapp     # Default Nuxt port
```

## Code Quality

```bash
# Lint and format (Biome)
make check

# Run tests
npm run test --workspaces --if-present

# Type checking
npm run test:types --workspaces --if-present

# E2E tests (landing only, requires Playwright)
npm run test:e2e --workspace=@nvisy/landing
```

## Build

Shared libraries must build before the packages that depend on them.

```bash
make build-deps   # Build @nvisy/config and @nvisy/shared
make build-com    # Build landing page → output/com/
make build-app    # Build web app → output/app/
make build        # Build everything
```

If things break after pulling changes:

```bash
make repair       # Clean, reinstall, and rebuild shared deps
```

## Project Structure

```
packages/
├── nvisy-config/     # Shared configuration (TypeScript library)
├── nvisy-shared/     # Shared utilities (TypeScript library)
├── nvisy-landing/    # Landing page (Astro + Vue)
└── nvisy-webapp/     # Web application (Nuxt + Vue)
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Landing | Astro 6, Vue 3 |
| Webapp | Nuxt 4, Vue 3 |
| Styling | Tailwind CSS 4, shadcn-vue |
| Testing | Vitest (unit), Playwright (E2E) |
| Linting | Biome |
| Types | TypeScript 5 (strict) |

## Code Style

- **Biome** handles formatting and linting — TAB indentation, double quotes
- **Vue**: Composition API with `<script setup>`
- **TypeScript**: Strict mode enabled
- Path aliases: `@/*` maps to `src/` (landing) or `app/` (webapp)

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Run `make check` to verify lint/format
4. Push and open a PR against `main`

CI will automatically run lint, type checks, unit tests, and E2E tests.
