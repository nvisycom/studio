# nvisy.com/landing

[![Node](https://img.shields.io/badge/node-%3E%3D20-black?style=flat&logo=node.js&logoColor=white&labelColor=black)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/astro-5.0-black?style=flat&logo=astro&logoColor=white&labelColor=black)](https://astro.build/)
[![Vue](https://img.shields.io/badge/vue-3.5-black?style=flat&logo=vue.js&logoColor=white&labelColor=black)](https://vuejs.org/)

## Overview

Landing page package for nvisy.com, built with Astro and Vue. Features modern
component architecture with Tailwind CSS, MDX support, and optimized build
outputs.

## Tech Stack

- **Astro 5**: Static site generation with island architecture
- **Vue 3.5**: Interactive components with Composition API
- **Tailwind CSS 4**: Utility-first styling with Vite integration
- **Reka UI**: Accessible, unstyled component primitives
- **MDX**: Markdown with component support
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing

## Project Structure

```
.
├── src/
│   ├── components/       # Vue and Astro components
│   ├── layouts/          # Page layouts
│   ├── pages/            # Route pages
│   └── styles/           # Global styles
├── public/               # Static assets
└── dist/                 # Build output
```

## Notes

- Components use Reka UI for accessibility
- Tailwind CSS v4 with Vite plugin for optimal performance
- MDX support for content-rich pages
- Type-safe development with TypeScript
