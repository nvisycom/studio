# @nvisy/desktop

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/studio/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/studio/actions/workflows/build.yml)

Desktop shell for the Nvisy console, wrapping the web frontend in a Tauri window.

## Overview

The same dashboard as the web app, delivered as a native desktop application.
This app extends the shared [`@nvisy/console`](../../packages/console/) layer for
its frontend and adds a [Tauri 2](https://tauri.app/) (Rust) shell in `tauri/`.
Nuxt generates a static SPA that Tauri loads and hosts in a native window.

## Requirements

- Node.js 22.18+ and npm 10+ (shared with the rest of the workspace)
- Rust + Cargo — see [tauri.app/start/prerequisites](https://tauri.app/start/prerequisites/)

## Development

```bash
npm run dev -w @nvisy/desktop         # Frontend dev server (port 1420)
npm run tauri -w @nvisy/desktop dev   # App in a Tauri window
npm run build -w @nvisy/desktop       # Build the frontend
```

## Notes

- `tauri/` is managed by the Rust toolchain and is **not** linted or formatted
  by Biome.
- The desktop Rust build is not wired into CI yet.

## License

Apache 2.0 License, see [LICENSE.txt](../../LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/studio/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
