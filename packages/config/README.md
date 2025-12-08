# nvisy.com/config

[![Node](https://img.shields.io/badge/node-%3E%3D20-black?style=flat&logo=node.js&logoColor=white&labelColor=black)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0-black?style=flat&logo=typescript&logoColor=white&labelColor=black)](https://www.typescriptlang.org/)

## Overview

Shared configuration package for the nvisy.com monorepo. Provides constants, utilities, and type-safe configuration exports for use across all workspace packages (landing, webapp).

## Tech Stack

- **TypeScript 5**: Type-safe development
- **tsup**: Fast TypeScript bundler
- **Vitest**: Unit testing and benchmarking

## Exports

The package provides multiple entry points:

```typescript
// Main export
import { ... } from '@nvisy/config'

// Constants
import { ... } from '@nvisy/config/constants'
```

**Note**: Shared utilities have been moved to the `@nvisy/shared` package.

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

## Usage Across Packages

This package is consumed by:
- **shared**: Configuration for shared utilities package
- **landing**: Static site configuration and constants
- **webapp**: Application configuration and constants

## Notes

- Dual module support (ESM + CommonJS)
- Tree-shakeable exports for optimal bundle size
- Full TypeScript type definitions included
- Benchmarking suite for performance tracking
- Centralized configuration reduces duplication across packages
