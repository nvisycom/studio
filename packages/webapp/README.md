# nvisy.com/webapp

[![Node](https://img.shields.io/badge/node-20-black?style=flat&logo=node.js&logoColor=white&labelColor=black)](https://nodejs.org/)
[![Nuxt](https://img.shields.io/badge/nuxt-3-black?style=flat&logo=nuxt.js&logoColor=white&labelColor=black)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/vue-3.5-black?style=flat&logo=vue.js&logoColor=white&labelColor=black)](https://vuejs.org/)

## Overview

Single-page application for [app.nvisy.com](https://app.nvisy.com), built with
[Nuxt](https://nuxt.com/) 3 and [Vue](https://vuejs.org/). Features a complete
dashboard interface with authentication, document management, team
collaboration, and integration capabilities. Uses [Nuxt](https://nuxt.com/) 3 as
a full-stack Vue framework, [Vue](https://vuejs.org/) 3.5 for reactive UI
components, [Tailwind CSS](https://tailwindcss.com/) 4 for styling,
[shadcn-vue](https://www.shadcn-vue.com/) for UI components, and
[Reka UI](https://www.reka-ui.com/) for accessible primitives. Includes
internationalization support for English and German.

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

- Client-side rendered SPA for dynamic, interactive user experience
- Full TypeScript type safety across the application
- Modular component architecture for maintainability
