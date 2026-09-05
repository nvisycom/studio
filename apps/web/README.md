# @nvisy/webapp

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/studio/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/studio/actions/workflows/build.yml)

Web shell for the Nvisy console, served at [app.nvisy.com](https://app.nvisy.com).

## Overview

A Nuxt 4 SPA that extends the shared [`@nvisy/console`](../../packages/console/)
layer. The layer provides the dashboard surface; this app adds only its own
shell — `app.vue`, layouts, middleware, routes (`pages/`), and chrome
(AppHeader/Footer, sidebar). Shared code is imported through the `#console`
alias; the app's own `@/` and `~/` point at `app/`.

## Development

```bash
npm run dev -w @nvisy/webapp        # Dev server (port 3000)
npm run build -w @nvisy/webapp      # Production build -> ./output
npm run typecheck -w @nvisy/webapp  # Type check
```

The app runs in SPA mode (no SSR); the build output is a static bundle in
`./output`.

## License

GNU Affero General Public License v3.0 (AGPL-3.0), see [LICENSE.txt](../../LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/studio/issues)
- **Email**: [hello@nvisy.com](mailto:hello@nvisy.com)
