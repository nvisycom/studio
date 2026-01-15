# Nvisy Portal

Monorepo for Nvisy's web properties, built with Astro, Nuxt, and Vue.

## Structure

```
packages/
├── nvisy-config/    # Shared configuration
├── nvisy-shared/    # Shared utilities
├── nvisy-landing/   # Landing page (nvisy.com)
└── nvisy-webapp/    # Web application (app.nvisy.com)
```

## Requirements

- Node.js 20+
- npm 8+

## Getting Started

```bash
make install    # Install dependencies
make build      # Build all packages
make check      # Run code quality checks
make clean      # Clean build artifacts
```

## Packages

| Package | Description |
|---------|-------------|
| `@nvisy/config` | Shared configuration and constants |
| `@nvisy/shared` | Shared utilities and helpers |
| `@nvisy/landing` | Static landing page (Astro + Vue) |
| `@nvisy/webapp` | Web application (Nuxt + Vue) |
