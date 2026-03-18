# Nvisy Portal

Monorepo for Nvisy's web properties, built with Astro, Nuxt, and Vue.

## Packages

| Package | Description | Tech |
|---------|-------------|------|
| `@nvisy/config` | Shared configuration and constants | TypeScript |
| `@nvisy/shared` | Shared utilities and helpers | TypeScript |
| `@nvisy/landing` | Landing page — [nvisy.com](https://nvisy.com) | Astro 6, Vue 3 |
| `@nvisy/webapp` | Web application — [app.nvisy.com](https://app.nvisy.com) | Nuxt 4, Vue 3 |

## Quick Start

```bash
make install      # Install dependencies
make build-deps   # Build shared libraries
npm run dev --workspace=@nvisy/landing    # Start landing dev server
npm run dev --workspace=@nvisy/webapp     # Start webapp dev server
```

## Commands

```bash
make build        # Build all packages
make check        # Lint and format check (Biome)
make clean        # Remove build artifacts and node_modules
make repair       # Clean, reinstall, and rebuild
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, development workflow, and code style guidelines.

## License

Proprietary, see [LICENSE.txt](LICENSE.txt).

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/portal/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
