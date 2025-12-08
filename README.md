# nvisy.com

[![Node](https://img.shields.io/badge/node-%3E%3D20-black?style=flat&logo=node.js&logoColor=white&labelColor=black)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/astro-5.0-black?style=flat&logo=astro&logoColor=white&labelColor=black)](https://astro.build/)
[![Vue](https://img.shields.io/badge/vue-3.5-black?style=flat&logo=vue.js&logoColor=white&labelColor=black)](https://vuejs.org/)

## Overview

Modern monorepo for Nvisy's web properties, built with Astro, Nuxt, and Vue. This workspace manages shared configurations, a statically-rendered landing page (nvisy.com), and a single-page web application (app.nvisy.com) with optimized build processes and type-safe development workflows.

## Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 8 or higher
- **Git**: For version control

## Project Structure

```
.
├── .github/
│   └── workflows/         # GitHub Actions CI/CD workflows
├── packages/              # Workspace packages
│   ├── config/            # Shared configuration package
│   ├── shared/            # Shared utilities and helpers
│   ├── landing/           # Static landing page - nvisy.com (Astro + Vue)
│   └── webapp/            # SPA web application - app.nvisy.com (Nuxt + Vue)
├── Makefile               # Build automation
├── package.json           # Root package configuration
└── README.md              # This file
```
