# Contributing

Thank you for your interest in contributing to the Nvisy web application.

## Prerequisites

- [Node.js](https://nodejs.org/) 22.18+
- [npm](https://www.npmjs.com/) 10+
- [Make](https://www.gnu.org/software/make/) (included on macOS/Linux)

## Setup

```bash
# Clone the repository
git clone https://github.com/nvisycom/portal.git
cd portal

# Install dependencies
make install
```

## Development

```bash
npm run dev       # http://localhost:3000
```

## Code Quality

```bash
# Lint and format (Biome)
make check

# Type checking
npm run typecheck
```

## Build

```bash
make build        # Build the app → output/
```

If things break after pulling changes:

```bash
make repair       # Clean and reinstall dependencies
```

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Run `make check` to verify lint/format
4. Push and open a PR against `main`

CI will automatically run lint, type checks, and a production build.
