# Nvisy Desktop Application

[![build](https://img.shields.io/github/actions/workflow/status/nvisycom/app/build.yml?branch=main&color=000000&style=flat-square)](https://github.com/nvisycom/app/actions/workflows/build.yml)
[![node](https://img.shields.io/badge/Node.JS-23.0+-000000?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![typescript](https://img.shields.io/badge/TypeScript-5.8+-000000?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![tauri](https://img.shields.io/badge/Tauri-2.0+-000000?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app/)
[![nuxt](https://img.shields.io/badge/Nuxt-4.1+-000000?style=flat-square&logo=nuxt.js&logoColor=white)](https://nuxt.com/)

Cross-platform desktop application for the Nvisy document redaction platform.

## Features

- **Cross-Platform** - Native desktop app for Windows, macOS, and Linux
- **Modern Stack** - Built with Tauri, Nuxt.js, and Vue 3
- **Document Processing** - Advanced document redaction and processing
  capabilities
- **Secure** - Local processing with enterprise-grade security
- **Fast** - Rust backend with optimized frontend for maximum performance
- **Offline-First** - Core functionality works without internet connection

## Requirements

- Node.js 23.0.0 or higher
- Rust 1.70.0 or higher (for Tauri)
- Platform-specific dependencies:
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: Development packages (see
    [Tauri prerequisites](https://tauri.app/v2/guides/getting-started/prerequisites/))

## Installation

### Download Pre-built Releases

Download the latest release for your platform from
[GitHub Releases](https://github.com/nvisycom/app/releases).

### Build from Source

1. Clone the repository:

```bash
git clone https://github.com/nvisycom/app.git
cd app
```

2. Install dependencies:

```bash
npm install
```

3. Build and run:

```bash
cd packages/desktop
npm run tauri:build
```

## Development

### Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
cd packages/desktop
npm run tauri:dev
```

This will start the Nuxt.js development server and launch the Tauri app in
development mode with hot reloading.

### Project Structure

```
app/
├── packages/
│   ├── config/          # Shared configuration utilities
│   │   ├── src/         # TypeScript source
│   │   └── dist/        # Built output
│   └── desktop/         # Main desktop application
│       ├── components/  # Vue components
│       ├── pages/       # Nuxt.js pages
│       ├── tauri/       # Tauri configuration and Rust code
│       └── dist/        # Built frontend assets
├── .github/             # GitHub workflows
└── node_modules/        # Dependencies
```

### Available Scripts

#### Root Level

- `npm install` - Install all dependencies for all packages

#### Desktop Package (`packages/desktop/`)

- `npm run dev` - Start Nuxt.js development server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview built frontend
- `npm run tauri:dev` - Start Tauri development mode
- `npm run tauri:build` - Build desktop application
- `npm run lint` - Check code style with Biome
- `npm run format` - Format code with Biome
- `npm run check` - Run all linting and formatting checks

#### Config Package (`packages/config/`)

- `npm run build` - Build configuration package
- `npm run test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage report
- `npm run bench` - Run benchmarks

### Development Workflow

1. Make changes to the code
2. Use `npm run tauri:dev` for live development
3. Run quality checks:
   ```bash
   npm run check    # Lint and format
   npm run test     # Run tests (in config package)
   ```
4. Build and test:
   ```bash
   npm run tauri:build
   ```

## Configuration

The application uses a layered configuration system:

1. **Default configuration** - Built into the app
2. **Environment variables** - For deployment-specific settings
3. **User preferences** - Stored locally and editable through the UI

## Building for Production

### Desktop Application

```bash
cd packages/desktop
npm run tauri:build
```

This creates platform-specific installers in
`packages/desktop/tauri/target/release/bundle/`.

### All Packages

```bash
npm run build
```

Builds all packages in the workspace.

## Troubleshooting

### Common Issues

**Tauri build fails:**

- Ensure Rust is installed and up to date
- Check platform-specific prerequisites
- Try clearing the target directory: `rm -rf packages/desktop/tauri/target`

**Development server won't start:**

- Ensure Node.js version is 23.0+
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check port 3000 is available

**Frontend changes not reflected:**

- Ensure development server is running with `npm run dev`
- Check browser console for errors
- Try hard refresh or clear browser cache

### Getting Help

- Check existing [GitHub Issues](https://github.com/nvisycom/app/issues)
- Review [Tauri documentation](https://tauri.app/v2/guides/)
- Review [Nuxt.js documentation](https://nuxt.com/docs)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for
guidelines on:

- Development setup
- Coding standards
- Pull request process
- Testing requirements

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes and version history.

## License

This project is licensed under the MIT License - see [LICENSE.txt](LICENSE.txt)
for details.

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/app/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
- **Website**: [nvisy.com](https://nvisy.com)

---

Built with ❤️ by the Nvisy Software Team
