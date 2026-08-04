# Studio

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/studio/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/studio/actions/workflows/build.yml)

Nvisy's product console — the web app ([app.nvisy.com](https://app.nvisy.com))
and a Tauri desktop app, sharing one dashboard via a Nuxt layer.

The dashboard surface (design system, feature views, composables, and the
`@nvisy/sdk` data layer) lives in a shared `@nvisy/console` Nuxt layer, and each
app provides only its own shell. The web app is a Nuxt SPA; the desktop app
wraps the same frontend in a Tauri native shell.

> [!WARNING]
> **Active development: API not stable.** This project is under active
> development. Public APIs, configuration shapes, and on-disk formats may change
> without notice between releases.

## Workspace

An npm workspace split into deployable **apps** and the shared **package** they
build on.

**Apps** (`apps/*`) — the shells that ship:

- **[`@nvisy/webapp`](apps/web/)** (`apps/web`) — web shell, a Nuxt 4 SPA served
  at [app.nvisy.com](https://app.nvisy.com)
- **[`@nvisy/desktop`](apps/desktop/)** (`apps/desktop`) — desktop shell: the
  same frontend wrapped in a [Tauri 2](https://tauri.app/) (Rust) native window,
  with the Rust shell living in `apps/desktop/tauri/`

**Packages** (`packages/*`) — the shared code the apps build on:

- **[`@nvisy/console`](packages/console/)** — Nuxt layer holding the whole
  dashboard surface: design system (shadcn-vue), feature views, composables, the
  `@nvisy/sdk` data layer, theme, and i18n
- **[`@nvisy/config`](packages/config/)** — shared configuration and constants,
  built as a platform-neutral ESM library (tsdown)

Each app opts in with `extends: ["@nvisy/console"]` and imports shared code
through the `#console` alias; the layer provides everything, the apps add only
their own shell.

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
apps/
├── web/            # web shell — Nuxt 4 SPA (@nvisy/webapp)
└── desktop/        # desktop shell (@nvisy/desktop)
    ├── app/        #   Nuxt frontend (extends @nvisy/console)
    └── tauri/      #   Tauri 2 Rust shell (Cargo, tauri.conf.json)
packages/
├── console/        # shared Nuxt layer (@nvisy/console)
└── config/         # shared config & constants — ESM lib (@nvisy/config)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

Apache 2.0 License, see [LICENSE.txt](LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/studio/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
