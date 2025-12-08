# nvisy.com

[![Node](https://img.shields.io/badge/node-20-black?style=flat&logo=node.js&logoColor=white&labelColor=black)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/astro-5.0-black?style=flat&logo=astro&logoColor=white&labelColor=black)](https://astro.build/)
[![Nuxt](https://img.shields.io/badge/nuxt-3-black?style=flat&logo=nuxt.js&logoColor=white&labelColor=black)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/vue-3.5-black?style=flat&logo=vue.js&logoColor=white&labelColor=black)](https://vuejs.org/)

## Overview

Modern monorepo for Nvisy's web properties, built with
[Astro](https://astro.build/), [Nuxt](https://nuxt.com/), and
[Vue](https://vuejs.org/). Manages shared configurations, a statically-rendered
landing page ([nvisy.com](https://nvisy.com)), and a single-page web application
([app.nvisy.com](https://app.nvisy.com)) with optimized build processes and
type-safe development workflows.

**Prerequisites:** [Node.js](https://nodejs.org/) 20+, npm 8+,
[Git](https://git-scm.com/)

## Project Structure

```
.
├── .github/
│   └── workflows/         # GitHub Actions CI/CD workflows
├── packages/              # Workspace packages
│   ├── config/            # Shared configuration package
│   ├── shared/            # Shared utilities and helpers
│   ├── landing/           # Static landing page (Astro + Vue)
│   └── webapp/            # SPA web application (Nuxt + Vue)
├── Makefile               # Build automation
├── package.json           # Root package configuration
└── README.md              # This file
```

## Development

Install dependencies:

```bash
make install
```

Build all packages:

```bash
make build
```

Run code quality checks:

```bash
make check
```

Clean build artifacts:

```bash
make clean
```

## Notes

- Uses npm workspaces for monorepo management
- Shared packages (`@nvisy/config`, `@nvisy/shared`) provide common utilities
- Landing page uses Astro for static site generation
- Webapp uses Nuxt for SPA functionality
