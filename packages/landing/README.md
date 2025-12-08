# nvisy.com/landing

[![Node](https://img.shields.io/badge/node-20-black?style=flat&logo=node.js&logoColor=white&labelColor=black)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/astro-5.0-black?style=flat&logo=astro&logoColor=white&labelColor=black)](https://astro.build/)
[![Vue](https://img.shields.io/badge/vue-3.5-black?style=flat&logo=vue.js&logoColor=white&labelColor=black)](https://vuejs.org/)

## Overview

Statically-rendered landing page for [nvisy.com](https://nvisy.com), built with
[Astro](https://astro.build/) and [Vue](https://vuejs.org/). Features modern
component architecture with [Tailwind CSS](https://tailwindcss.com/),
[MDX](https://mdxjs.com/) support, and optimized static build outputs for
maximum performance. Uses [Astro](https://astro.build/) 5 for static site
generation with island architecture, [Vue](https://vuejs.org/) 3.5 for
interactive components, [Tailwind CSS](https://tailwindcss.com/) 4 for styling,
and [Reka UI](https://www.reka-ui.com/) for accessible component primitives.

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

## Development

Start the development server:

```bash
npm run dev
```

## Build

Build for production:

```bash
npm run build
```

Preview the build:

```bash
npm run preview
```

## Notes

- Statically generated for optimal performance and SEO
- Island architecture for selective hydration
- MDX support for content-rich pages
