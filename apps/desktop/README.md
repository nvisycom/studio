# @nvisy/desktop

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/studio/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/studio/actions/workflows/build.yml)

Desktop shell for the Nvisy console — the web dashboard delivered as a native
application, with a [Tauri 2](https://tauri.app/) (Rust) shell.

## Features

- **Shared frontend:** extends the [`@nvisy/console`](../../packages/console/) layer; Nuxt generates a static SPA that Tauri hosts
- **Tray-first:** a system-tray anchor manages the main window and app actions
- **Native shell:** window management, persisted settings, and localized native UI in `tauri/src/`

## Requirements

- Node.js 22.18+ and npm 10+ (shared with the rest of the workspace)
- Rust + Cargo — see [tauri.app/start/prerequisites](https://tauri.app/start/prerequisites/)
- Nightly `rustfmt` for formatting the Rust shell (its `rustfmt.toml` uses
  nightly-only options): `rustup toolchain install nightly --component rustfmt`

## Development

```bash
npm run dev -w @nvisy/desktop         # Frontend dev server (port 1420)
npm run tauri -w @nvisy/desktop dev   # App in a Tauri window
npm run build -w @nvisy/desktop       # Build the frontend
```

## Notes

- `tauri/` is managed by the Rust toolchain and is **not** linted or formatted
  by Biome; it has its own CI in [`desktop.yml`](../../.github/workflows/desktop.yml).

## License

Apache 2.0 License, see [LICENSE.txt](../../LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/studio/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
