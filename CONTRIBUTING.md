# Contributing

Thank you for your interest in contributing to the Nvisy Desktop Application!

## Requirements

- Node.js 23.0.0 or higher
- Rust 1.70.0 or higher (for Tauri development)
- TypeScript 5.8.0 or higher
- npm (comes with Node.js)

### Platform-Specific Requirements

- **Windows**: Microsoft Visual Studio C++ Build Tools
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Linux**: Development packages (see
  [Tauri prerequisites](https://tauri.app/v2/guides/getting-started/prerequisites/))

## Development Setup

1. Fork and clone the repository:

```bash
git clone https://github.com/your-username/app.git
cd app
```

2. Install all dependencies:

```bash
npm install
```

3. Verify setup by running the development server:

```bash
cd packages/desktop
npm run tauri:dev
```

## Project Structure

```
app/
├── packages/
│   ├── config/          # Shared configuration utilities
│   │   ├── src/         # TypeScript source files
│   │   ├── dist/        # Built output
│   │   └── package.json
│   └── desktop/         # Main Tauri desktop application
│       ├── components/  # Vue 3 components
│       ├── pages/       # Nuxt.js pages and routing
│       ├── tauri/       # Tauri config and Rust backend
│       ├── dist/        # Built frontend assets
│       └── package.json
├── .github/             # GitHub Actions workflows
├── LICENSE.txt          # MIT license
└── package.json         # Workspace root configuration
```

## Development Workflow

### 1. Development Server

Start the development environment:

```bash
cd packages/desktop
npm run tauri:dev
```

This starts both the Nuxt.js development server and the Tauri application with
hot reloading.

### 2. Making Changes

- **Frontend**: Edit files in `packages/desktop/` (Vue components, pages, etc.)
- **Configuration**: Edit files in `packages/config/src/`
- **Backend/Tauri**: Edit Rust files in `packages/desktop/tauri/src/`

### 3. Available Scripts

#### Root Level

- `npm install` - Install dependencies for all packages

#### Desktop Package (`packages/desktop/`)

- `npm run dev` - Nuxt.js development server
- `npm run build` - Build frontend for production
- `npm run tauri:dev` - Start Tauri development mode
- `npm run tauri:build` - Build desktop application
- `npm run lint` - Check code style with Biome
- `npm run format` - Format code with Biome
- `npm run check` - Run all checks (lint + format)

#### Config Package (`packages/config/`)

- `npm run build` - Build configuration package
- `npm run test` - Run test suite with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage report
- `npm run test:types` - TypeScript type checking
- `npm run bench` - Run performance benchmarks

### 4. Quality Checks

Before submitting changes, run these commands:

```bash
# Check and fix code style
npm run check

# Run tests (in config package)
cd packages/config
npm test

# Verify TypeScript compilation
npm run test:types

# Build to ensure everything works
cd ../desktop
npm run tauri:build
```

## Code Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer type safety over convenience
- Use native JavaScript private fields (`#privateField`)
- Write JSDoc comments for public APIs
- Use modern ES2022+ features

### Vue/Nuxt.js

- Use Composition API with `<script setup>`
- Follow Vue 3 best practices
- Use TypeScript in all Vue files
- Organize components logically
- Use Nuxt.js conventions for pages and layouts

### Rust (Tauri Backend)

- Follow standard Rust conventions
- Use `cargo fmt` for formatting
- Run `cargo clippy` for linting
- Write tests for new functionality

### General

- Use Biome for code formatting and linting
- Follow existing patterns in the codebase
- Write clear, self-documenting code
- Add tests for new features
- Update documentation when needed

## Testing

### Frontend Testing

Currently, frontend testing is handled at the integration level. We welcome
contributions to improve test coverage.

### Config Package Testing

The config package uses Vitest for testing:

```bash
cd packages/config
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:cov        # With coverage
npm run bench           # Performance benchmarks
```

### Writing Tests

- Write unit tests for utility functions
- Test error conditions and edge cases
- Use descriptive test names
- Mock external dependencies
- Aim for good test coverage

## Pull Request Process

### 1. Before Starting

- Check existing issues and PRs to avoid duplication
- Create an issue to discuss large changes
- Fork the repository and create a feature branch

### 2. Branch Naming

Use descriptive branch names:

- `feature/add-document-encryption`
- `fix/memory-leak-in-preview`
- `docs/update-installation-guide`

### 3. Making Changes

- Make focused, atomic commits
- Write clear commit messages
- Keep changes small and reviewable
- Update tests and documentation

### 4. Pre-submission Checklist

- [ ] Code follows project style guidelines
- [ ] All quality checks pass (`npm run check`)
- [ ] Tests pass (`npm test` in config package)
- [ ] TypeScript compilation succeeds
- [ ] Desktop application builds successfully
- [ ] Documentation updated if needed
- [ ] No breaking changes (or properly documented)
- [ ] Commit messages are clear and descriptive

### 5. Submitting the PR

1. Push your branch to your fork
2. Open a pull request against the main branch
3. Fill out the PR template completely
4. Add relevant labels and reviewers
5. Be responsive to feedback

### 6. PR Requirements

- **Description**: Clear explanation of changes and motivation
- **Testing**: Evidence that changes work as expected
- **Documentation**: Updates to README, comments, or docs as needed
- **Breaking Changes**: Clearly marked and explained
- **Screenshots**: For UI changes, include before/after images

## Release Process

Releases are handled by maintainers following semantic versioning:

- **Patch** (0.1.1): Bug fixes, minor improvements
- **Minor** (0.2.0): New features, non-breaking changes
- **Major** (1.0.0): Breaking changes, major rewrites

## Getting Help

### Documentation

- [Tauri Documentation](https://tauri.app/v2/guides/)
- [Nuxt.js Documentation](https://nuxt.com/docs)
- [Vue 3 Documentation](https://vuejs.org/guide/)
- [Biome Documentation](https://biomejs.dev/)

### Communication

- **Issues**: [GitHub Issues](https://github.com/nvisycom/app/issues) for bugs
  and feature requests
- **Discussions**:
  [GitHub Discussions](https://github.com/nvisycom/app/discussions) for
  questions and ideas
- **Email**: [support@nvisy.com](mailto:support@nvisy.com) for private matters

### Common Issues

**Build fails with Rust errors:**

- Update Rust: `rustup update`
- Check Tauri prerequisites for your platform
- Clear target directory: `rm -rf packages/desktop/tauri/target`

**Node.js version issues:**

- Use Node.js 23.0+ (check with `node --version`)
- Consider using a Node version manager (nvm, fnm)

**Dependency issues:**

- Clear node_modules: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`

## Recognition

Contributors are recognized in several ways:

- Listed in release notes for their contributions
- Added to the contributors section (for significant contributions)
- Invited to the contributors team (for ongoing involvement)

## License Agreement

By contributing, you agree that your contributions will be licensed under the
MIT License that covers the project. You also represent that you have the right
to make the contributions.

---

Thank you for contributing to Nvisy Desktop Application! 🎉
