# nvisy.com/webapp

[![Node](https://img.shields.io/badge/node-%3E%3D20-black?style=flat&logo=node.js&logoColor=white&labelColor=black)](https://nodejs.org/)
[![Nuxt](https://img.shields.io/badge/nuxt-3-black?style=flat&logo=nuxt.js&logoColor=white&labelColor=black)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/vue-3.5-black?style=flat&logo=vue.js&logoColor=white&labelColor=black)](https://vuejs.org/)

## Overview

Single-page application for app.nvisy.com, built with Nuxt 3 and Vue. Features a complete dashboard interface with authentication, document management, team collaboration, and integration capabilities.

## Tech Stack

- **Nuxt 3**: Full-stack Vue framework with SSR
- **Vue 3.5**: Reactive UI components with Composition API
- **Tailwind CSS 4**: Utility-first styling with Vite integration
- **shadcn-vue**: High-quality, accessible UI components
- **i18n**: Internationalization support (English, German)
- **Reka UI**: Unstyled, accessible component primitives

## Project Structure

```
.
├── app/
│   ├── components/       # Vue components
│   ├── layouts/          # Application layouts
│   ├── pages/            # Route pages
│   ├── composables/      # Vue composables
│   └── assets/           # Static assets
├── i18n/                 # Internationalization
│   ├── locales/          # Translation files
│   └── i18n.ts           # i18n configuration
├── public/               # Public static files
└── nuxt.config.ts        # Nuxt configuration
```

## Features

- **Authentication**: Login, signup, password recovery
- **Dashboard**: Overview and activity tracking
- **Document Management**: Upload and manage documents
- **Team Management**: Invite members, manage roles and permissions
- **Integrations**: Connect with Dropbox, Google Drive, OneDrive, Webhooks
- **API Tokens**: Generate and manage API access tokens
- **Settings**: Account, billing, security, and notifications
- **Internationalization**: Multi-language support (en, de)

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Build

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deployment

- **Domain**: app.nvisy.com
- **Type**: Single-Page Application (SPA)
- **Build output**: Client-side rendered Vue application

## Notes

- Client-side rendered SPA for dynamic, interactive user experience
- Uses shadcn-vue for consistent, accessible UI components
- Implements Nuxt's auto-import for components and composables
- Tailwind CSS v4 with Vite plugin for optimal performance
- Full TypeScript type safety across the application
- Modular component architecture for maintainability
