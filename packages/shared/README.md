# nvisy.com/shared

[![Node](https://img.shields.io/badge/node-20-black?style=flat&logo=node.js&logoColor=white&labelColor=black)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0-black?style=flat&logo=typescript&logoColor=white&labelColor=black)](https://www.typescriptlang.org/)

## Overview

Shared utilities and helper functions for the nvisy.com monorepo. Provides
common functionality used across both the landing page and web application
packages. Built with [TypeScript](https://www.typescriptlang.org/) 5, bundled
with [tsup](https://tsup.egoist.dev/), and tested with
[Vitest](https://vitest.dev/).

## Project Structure

```
.
├── src/
│   ├── index.ts          # Main exports
│   ├── constants.ts      # Shared constants
│   └── utilities.ts      # Utility functions
└── dist/                 # Build output (ESM)
```

## Development

Build the package:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

## Notes

- ESM-only module format
- Tree-shakeable exports for optimal bundle size
