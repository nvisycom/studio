# Portal

Web application for Nvisy — [app.nvisy.com](https://app.nvisy.com).

A single-page application built with Nuxt and Vue, running in SPA mode against
the Nvisy API. It is the authenticated product surface: dashboards, workflow
runs, and account management, with the API wired in through the `@nvisy/sdk`
client.

## Requirements

- Node.js 22.18+
- npm 10+

## Quick Start

```bash
make install      # Install dependencies
npm run dev       # Start dev server (port 3000)
```

## Commands

```bash
make build        # Build the app (output in ./output)
make check        # Lint and format check (Biome)
make clean        # Remove build artifacts and node_modules
make repair       # Clean and reinstall

npm run typecheck # Type check (nuxt typecheck)
```

## License

Apache 2.0 License, see [LICENSE.txt](LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/portal/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
