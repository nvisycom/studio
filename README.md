# Portal

Nvisy's product console — the web app ([app.nvisy.com](https://app.nvisy.com))
and a Tauri desktop app, sharing one dashboard via a Nuxt layer.

A workspace where the dashboard surface (design system, feature views,
composables, and the API data layer) lives in a shared `@nvisy/console`
Nuxt layer, and each app provides only its own shell. The web app is a Nuxt
SPA; the desktop app wraps the same frontend in a Tauri native shell.

## Packages

- **`@nvisy/console`** — shared Nuxt layer: design system (shadcn-vue),
  feature components, composables, the `@nvisy/sdk` data layer, theme, and i18n
- **`@nvisy/webapp`** (`apps/web`) — web shell (Nuxt 4 SPA)
- **`@nvisy/desktop`** (`apps/desktop`) — desktop shell (Nuxt + Tauri)

Apps consume the layer via `extends: ["@nvisy/console"]`. Shared code is
imported through the `#console` alias.

## Requirements

- Node.js 22.18+
- npm 10+
- Rust + Cargo (desktop app only)

## Quick Start

```bash
make install                              # Install dependencies
npm run dev -w @nvisy/webapp              # Web dev server (port 3000)
npm run dev -w @nvisy/desktop             # Desktop frontend dev (port 1420)
npm run tauri -w @nvisy/desktop dev       # Desktop app (Tauri window)
```

## Commands

```bash
make build          # Build the web app -> ./output
make build-desktop  # Build the desktop frontend
make check          # Lint and format check (Biome)
make clean          # Remove build artifacts and node_modules
make repair         # Clean and reinstall

npm run typecheck   # Type check all workspaces
```

## Structure

```
packages/
└── console/        # shared Nuxt layer (@nvisy/console)
apps/
├── web/            # web shell (@nvisy/webapp)
└── desktop/        # desktop shell + src-tauri/ (@nvisy/desktop)
```

## License

Apache 2.0 License, see [LICENSE.txt](LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/portal/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
