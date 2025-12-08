# nvisy.com/shared

[![Node](https://img.shields.io/badge/node-%3E%3D20-black?style=flat&logo=node.js&logoColor=white&labelColor=black)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0-black?style=flat&logo=typescript&logoColor=white&labelColor=black)](https://www.typescriptlang.org/)

## Overview

Shared utilities and helper functions for the nvisy.com monorepo. Provides common functionality used across both the landing page and web application packages.

## Tech Stack

- **TypeScript 5**: Type-safe development
- **tsup**: Fast TypeScript bundler
- **Vitest**: Unit testing and benchmarking

## Exports

The package provides multiple entry points:

```typescript
// Main export (all utilities and constants)
import { calculateReadingTime, getInitials } from '@nvisy/shared'

// Constants only
import { WORDS_PER_MINUTE, MAX_INITIALS_LENGTH } from '@nvisy/shared/constants'

// Utilities only
import { calculateReadingTime, getInitials } from '@nvisy/shared/utilities'
```

## Project Structure

```
.
├── src/
│   ├── index.ts          # Main exports
│   ├── constants.ts      # Shared constants
│   └── utilities.ts      # Utility functions
└── dist/                 # Build output (ESM)
```

## Notes

- ESM-only module format
- Tree-shakeable exports for optimal bundle size
- Full TypeScript type definitions included
- Comprehensive test coverage
- Benchmarking suite for performance tracking
