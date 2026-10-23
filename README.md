<div align="center">

<img src=".github/assets/logo.png" alt="Nvisy Studio" width="104" height="104" />

# Nvisy Studio

**Detect and redact sensitive data across your documents.**

Nvisy's product console: a web app and a native desktop app, sharing one
dashboard through a Nuxt layer.

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/studio/build.yml?branch=main&label=build&style=flat-square)](https://github.com/nvisycom/studio/actions/workflows/build.yml)
[![Desktop](https://img.shields.io/github/actions/workflow/status/nvisycom/studio/desktop.yml?branch=main&label=desktop&style=flat-square)](https://github.com/nvisycom/studio/actions/workflows/desktop.yml)
[![Security](https://img.shields.io/github/actions/workflow/status/nvisycom/studio/security.yml?branch=main&label=security&style=flat-square)](https://github.com/nvisycom/studio/actions/workflows/security.yml)
[![License](https://img.shields.io/badge/license-AGPL%20v3-blue?style=flat-square)](LICENSE)

[**nvisy.com**](https://nvisy.com) · [**docs.nvisy.com**](https://docs.nvisy.com) · [**app.nvisy.com**](https://app.nvisy.com)

</div>

The dashboard (design system, feature views, and the data layer) lives in a
shared Nuxt layer, so both apps present the same experience. The web app is a
Nuxt SPA; the desktop app wraps the same frontend in a
[Tauri 2](https://tauri.app/) native shell and can point at any Nvisy server
(the hosted API by default, or a self-hosted one).

> [!WARNING]
> **Active development. API not stable.** Public APIs, configuration shapes, and
> on-disk formats may change without notice between releases.

## Workspace

An npm workspace split into deployable **apps** and the shared **packages** they
build on. The shared layer provides the whole dashboard; each app adds only its
own shell.

| Package | Path | Role |
| --- | --- | --- |
| **`@nvisy/console`** | [`packages/console`](packages/console/) | Nuxt layer with the whole dashboard surface: design system (shadcn-vue), feature views, composables, the `@nvisy/sdk` data layer, theme, and i18n |
| **`@nvisy/config`** | [`packages/config`](packages/config/) | Shared configuration and constants, a platform-neutral ESM library (tsdown) |
| **`@nvisy/webapp`** | [`apps/web`](apps/web/) | Web shell: a Nuxt 4 SPA served at [app.nvisy.com](https://app.nvisy.com) |
| **`@nvisy/desktop`** | [`apps/desktop`](apps/desktop/) | Desktop shell: the same frontend in a Tauri 2 (Rust) window; the Rust shell lives in `apps/desktop/tauri/` |

## Requirements

- **Node.js** 24+ and **npm** 10+
- **Rust + Cargo** (desktop app only)

## Getting started

```bash
git clone https://github.com/nvisycom/studio.git
cd studio
make install
```

Then run the web or desktop app, check the code, or build for release — see
[CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow, and `make help` for
every task the Makefile exposes.

## Project

- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines
- **License**: GNU Affero General Public License v3.0 (AGPL-3.0), see [LICENSE](LICENSE)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
