# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

### Removed

## [0.1.0] - 2025-01-20

### Added

- Initial release of the Nvisy Desktop Application
- Cross-platform desktop application built with Tauri 2.0+ and Nuxt.js 4.1+
- Modern frontend stack with Vue 3 Composition API and TypeScript 5.8+
- Monorepo workspace structure with two packages:
  - `@nvisy/desktop` - Main Tauri desktop application
  - `@nvisy/config` - Shared configuration utilities and constants
- Comprehensive development tooling:
  - Biome for code formatting and linting
  - Vitest for testing with coverage support
  - TypeScript strict configuration
  - ESM module support
- Desktop application features:
  - Native window management
  - Cross-platform compatibility (Windows, macOS, Linux)
  - Secure local document processing
  - Offline-first architecture
- Development scripts for:
  - Hot reloading development server (`tauri:dev`)
  - Production builds (`tauri:build`)
  - Code quality checks and formatting
  - Test execution and coverage reporting
- Configuration package with:
  - Shared constants and utilities
  - Type-safe configuration management
  - Multiple export paths for tree-shaking
  - Comprehensive test suite and benchmarks
- GitHub Actions workflow setup (placeholder)
- MIT license with proper attribution
- Comprehensive documentation and contribution guidelines

### Features

- Modern ES2022+ JavaScript target with full TypeScript support
- Rust backend with optimized performance
- Vue 3 frontend with Nuxt.js framework
- Secure cross-platform desktop application architecture
- Workspace-based monorepo for better code organization
- Development-focused tooling with hot reloading and live updates

### Development Environment

- Node.js 23.0+ requirement for latest features and performance
- Rust 1.70+ for Tauri backend development
- Platform-specific build requirements for native compilation
- Comprehensive development scripts and quality checks
- Test coverage reporting and performance benchmarking

[Unreleased]: https://github.com/nvisycom/app/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/nvisycom/app/releases/tag/v0.1.0
