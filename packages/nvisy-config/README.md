# nvisy.com/config

[![Node](https://img.shields.io/badge/node-20-black?style=flat&logo=node.js&logoColor=white&labelColor=black)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0-black?style=flat&logo=typescript&logoColor=white&labelColor=black)](https://www.typescriptlang.org/)

## Overview

Shared configuration package for the nvisy.com monorepo. Provides constants,
utilities, and type-safe configuration exports for use across all workspace
packages (landing, webapp). Built with
[TypeScript](https://www.typescriptlang.org/) 5, bundled with
[tsup](https://tsup.egoist.dev/), and tested with [Vitest](https://vitest.dev/).

## Project Structure

```
.
├── src/
│   ├── index.ts          # Main exports
│   └── constants.ts      # Shared constants
├── dist/                 # Build output (CJS + ESM)
├── assets/               # Static assets
└── schema.json           # JSON schema definitions
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

- Dual module support (ESM + CommonJS)
- Tree-shakeable exports for optimal bundle size
- Shared utilities have been moved to `@nvisy/shared` package
