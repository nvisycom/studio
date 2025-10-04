# nvisy.com

[![Node](https://img.shields.io/badge/node-%3E%3D20-black?style=flat&logo=node.js&logoColor=white&labelColor=black)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/astro-5.0-black?style=flat&logo=astro&logoColor=white&labelColor=black)](https://astro.build/)
[![Vue](https://img.shields.io/badge/vue-3.5-black?style=flat&logo=vue.js&logoColor=white&labelColor=black)](https://vuejs.org/)
[![License](https://img.shields.io/badge/license-MIT-black?style=flat&labelColor=black)](LICENSE)

## Overview

Modern monorepo for Nvisy's web properties, built with Astro and Vue. This workspace manages shared configurations and landing pages with optimized build processes and type-safe development workflows.

## Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 8 or higher
- **Git**: For version control

## Project Structure

```
.
├── .github/
│   └── workflows/          # GitHub Actions CI/CD workflows
│       ├── build.yaml      # Build and test pipeline
│       ├── integration.yaml # Integration tests
│       ├── performance.yaml # Performance testing
│       └── security.yaml   # Security audits
├── packages/               # Workspace packages
│   ├── config/            # Configuration package
│   └── landing/           # Landing page package
├── Makefile               # Build automation
├── package.json           # Root package configuration
└── README.md              # This file
```
