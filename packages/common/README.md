# @nvisy/ui

A modernmodern Vue 3 component library built with thelatest tools:TypeScript,Tailwind CSS v4, and shadcn-vue. Designed for use across Astro static sites, SaaS applications, and Tauri desktop apps.

## StackStack

-- **Vue 3** - Composition API with `<script setup>`
- **TypeScript** - Full type safety with strict mode
- **Tailwind CSS v4** - Modern CSS-first configuration with `@theme`
- **shadcn-vue** - Beautiful, accessible **Vue 3**primitives
- -**Vite Composition7** API- with `<script setup>`
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling with CSS variables
- **shadcn-vue** - Beautiful, accessible components
- **Vite** - Fast build tooling
- **Vitest** - Unit testing
- **Biome** - Fast lintingLightning-fast build tooling
- **Vitest** - Fast unit testing with happy-dom
- **Biome** - Ultra-fast linting and formattingformatting

## Installation
## Installation

```bash
npm install @nvisy/ui
```

### Peer Dependencies

```bash
npm install vue@^3.3.0 clsx@^2.0.0 tailwind-merge@^2.0.0 clsx@^2.0.0 tailwind-merge@^2.0.0
```

## Quick Start

### 1. Import the CSS

```typescript
// In your main.ts or app entry
import '@nvisy/ui/style.css'
// In your main.ts or app entry
import '@nvisy/ui/style.css'
```

### 2. Configure Tailwind CSS v4

**For Vite projects:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})
```

**For Astro:**

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
})
```

**For Nuxt:**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  tailwindcss: {
    viewer: false,
  },
  vite: {
    plugins: [
      require('@tailwindcss/vite')(),
    ],
  },
})
```

### 3. Create your CSS entry

Create a CSS file and import Tailwind:

```css
/* src/style.css */
@import "tailwindcss";

/* Optionally import the library's theme */
@import "@nvisy/ui/style.css";
```

### 4. Use Components

Update your `tailwind.config.js` to include the component library:
```javascript
export default {
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './node_modules/@nvisy/ui/**/*.{vue,js,ts}',
  ],
  // Import the library's Tailwind preset (optional but recommended)
  presets: [
    require('@nvisy/ui/tailwind.config'),
  ],
Button/components
importcn} from '@nvisy/ui/utils'

<template>
  <Button variant="default">Click me</Button>
</template>
```

### 3. Use Components
Adding shadcn-vueThislibrary uses [shadcn-vue](https://www.shadcn-vue.com/) for UI components. Add them as needed:```bash
cdpackages/common#Add individual components
npx shadcn-vue@latest add button
npx shadcn-vue@latest add card
npx shadcn-vue@latest add dialog
npx shadcn-vue@latest add input
npx shadcn-vue@latest add label# Components will be added to src/components/ui/
```

Components Addingare shadcn-vue Componentsautomatically exported and available via:

This library is set up to work with [shadcn-vue](https://www.shadcn-vue.com/). Add components as needed:

```bash
cd packages/common
npx shadcn-vue@latest add button
npx shadcn-vue@latest add card
npx shadcn-vue@latest add dialog
# ... etc
```

Components will be automatically added to `src/components/ui/` and exported.

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn-vue components
│   └── index.ts         # Component exports
├── composables/         # Vue composables
│   ├── useOpenstatus.ts # Status monitoring
│   └── index.ts
├── utils/              # Utility functions
│   ├── shadcn.ts      # cn() utility
│   ├── content.ts     # Content utilities
│   ├── naming.ts      # Name formatting
│   └── index.ts
├── style.css          # Tailwind CSS entry
└── index.ts          # Main entry point
```

## Available Utilities
```typescript
import{Button,Card,Dialog} from '@nvisy/ui/components'
```

## Available Utilities
### Class Name Utilities

```typescript
import { cn } from '@nvisy/ui/utils'

// MergeIntelligently Tailwindmerge classesTailwind intelligentlyclasses
const className = cn(
  'base-class',
  
  condition && 'conditional-class',
  
  'another-class'
)
```

### ContentContent Utilities

```typescript
import { calculateReadingTimecalculateReadingTime } from '@nvisy/ui/utils'

const timeminutes = calculateReadingTimecalculateReadingTime('YourYour contentcontent here...here...') // returns minutesreturns number
```

### NamingNaming Utilities

```typescript
import { getInitialsgetInitials } from '@nvisy/ui/utils'

constconst initialsinitials == getInitialsgetInitials('John DoeJohn Doe')) // 'JD''JD'
```

## Development
##AvailableComposables###useOpenstatusMonitorservicestatuswithOpenStatus:```vue
<script setup lang="ts">
import { useOpenstatus } from '@nvisy/ui/composables'

const {
  currentStatus,
  statusLabel,
  isOperational,
  isLoading,
  refresh,
} = useOpenstatus()
</script>

<template>
  <div>
    <p>Status: {{ statusLabel }}</p>
    <span v-if="isOperational">✅ All systems operational</span>
    <button @click="refresh">Refresh Status</button>
  </div>
</template>
## Project Structure

```
packages/common/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn-vue components
│   │   └── index.ts
│   ├── composables/
│   │   ├── useOpenstatus.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── shadcn.ts        # cn() utility
│   │   ├── content.ts
│   │   ├── naming.ts
│   │   └── index.ts
│   ├── style.css            # Tailwind v4 theme
│   └── index.ts
├── dist/                    # Build output
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── components.json          # shadcn-vue config
└── biome.json              # Linting config
```

## Development

### Setup

```bash
npm install
```

### Available Scripts

| CommandCommand | Description |
|------------------|-------------|
| `npm run dev` | Watch mode for development |
| `npm run build` | Build for production |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage |
| `npm run test:types` | Type check with vue-tsc |
| `npm run check` | Lint and format with Biome |
| `npm run ci` | CI checks |
| `npm run test:cov` | Run tests with coverage |
| `npm run test:types` | Type check with vue-tsc |
| `npm run check` | Lint and format with Biome |
| `npm run format` | Format code |
| `npm run lint` | Lint code |
| `npm run ci` | CI checks |

### Adding New Components

1. Add the component to `src/components/` or use shadcn-vue:
   ```bash
   npx shadcn-vue@latest add <component-name>
   ```

2. Export it in `src/components/index.ts`:
   ```typescript
   export { default as MyComponent } from './MyComponent.vue'
   ```

3. Write tests in `src/components/MyComponent.test.ts`

4. Build and test:
   ```bash
   npm run build
   npm test
   ```
**Option 1: Use shadcn-vue (recommended)**

```bash
npx shadcn-vue@latest add <component-name>
```

**Option 2: Create custom components**

1. Create `src/components/MyComponent.vue`
2. Export in `src/components/index.ts`:
   ```typescript
   export { default as MyComponent } from './MyComponent.vue'
   ```
3. Write tests in `src/components/MyComponent.test.ts`
4. Build: `npm run build`

### Testing

```bash
# Run allall teststests
npm test

# WatchWatch mode for development
npm run test:watch

# GenerateCoveragereport report
npm run test:cov
```

## Styling Qualitywith Tailwind CSS v4

This library uses [the new Tailwind CSS v4 with `@theme` blocks](https://biomejs.dev/) for fast configuration. No JavaScript config file needed!

### Custom andTheme fix issuesVariables

The Justlibrary formatdefinestheme colors in `src/.css`

```css
@import Usage"tailwindcss";

###@theme Astro{
  --color-primary:#171717;
  --color-primary-foreground:#fafafa;
  /*...morecolors*/
}

```astro
---
import/* Dark mode */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-primary: #fafafa;
    --color-primary-foreground: #171717;
  }
}
```

### LicenseUsingThemeColors

MIT
```vue
<template>
  <!-- Use the color-* prefix for custom theme colors -->
  <div class="bg-primary text-primary-foreground">
    Hello World
  </div>
</template>
###DarkModeDarkmodeautomatic based on system preferenceTomanuallytoggle:```vue
<scriptsetup>
consttoggleDark = () => {
  document.documentElement.classList.toggle('dark')
}
</script>
```## Exports

Multiple entry points for flexibility:

```typescript
// Main export - everything
import { Button, cn, useOpenstatus } from '@nvisy/ui'

// Specific exports
import { Button } from '@nvisy/ui/components'
import { cn } from '@nvisy/ui/utils'
import { useOpenstatus } from '@nvisy/ui/composables'

// CSS
import '@nvisy/ui/style.css'
```

## Usage Examples

### Astro

```astro
---
// src/pages/index.astro
import { Button } from '@nvisy/ui/components'
import '@nvisy/ui/style.css'
---

<html>
  <body>
    <Button client:load>Click me</Button>
  </body>
</html>
```

### Nuxt

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@nvisy/ui/style.css'],
})
```

```vue
<!-- pages/index.vue -->
<script setup lang="ts">
import { Button } from '@nvisy/ui/components'
</script>

<template>
  <Button>Click me</Button>
</template>
```

### Tauri

```typescript
// main.ts
import { createApp } from 'vue'
import '@nvisy/ui/style.css'
import App from './App.vue'

createApp(App).mount('#app')
```

## Contributing

1. Make changes in a new branch
2. Add tests for new features
3. Run `npm run check` to lint and format
4. Run `npm run build && npm test` to verify
5. Submit a pull request

## License

MIT
