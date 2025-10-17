# @nvisy/shared

Shared component library for Nvisy applications built with Vue 3, TypeScript, and Tailwind CSS.

## Installation

```bash
npm install @nvisy/shared
```

### Peer Dependencies

```bash
npm install vue class-variance-authority clsx tailwind-merge
```

### Optional Dependencies (for composables)

```bash
npm install pinia @pinia/colada
```

## Usage

### Styles

Import the CSS file in your application:

```typescript
import '@nvisy/shared/styles.css'
```

### Components

```typescript
// Import all
import { OpenStatus } from '@nvisy/shared'

// Or import from subpath
import { OpenStatus } from '@nvisy/shared/components'
```

### Utils

```typescript
// Import all
import { cn, calculateReadingTime, getInitials } from '@nvisy/shared'

// Or import from subpath
import { cn, calculateReadingTime, getInitials } from '@nvisy/shared/utils'
```

### Composables

```typescript
// Import from subpath
import { useOpenstatus, useOpenstatusStore, statusLabels } from '@nvisy/shared/composables'
import type { StatusLevel, StatusResponse } from '@nvisy/shared/composables'
```

### Global Installation

```typescript
import { createApp } from 'vue'
import SharedComponents from '@nvisy/shared'
import '@nvisy/shared/styles.css'

const app = createApp(App)
app.use(SharedComponents)
app.mount('#app')
```

## Available Exports

### Components
- `OpenStatus` - Status monitoring component with visual indicator

### Utils
- `cn()` - Class name utility combining clsx and tailwind-merge
- `calculateReadingTime()` - Calculate reading time for text content
- `getInitials()` - Extract initials from a name

### Composables
- `useOpenstatus()` - Status monitoring composable
- `useOpenstatusStore()` - Pinia store for status data
- `statusLabels` - Human-readable status labels
- Types: `StatusLevel`, `StatusResponse`

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build library
npm run build

# Type checking
npm run type-check
```

## License

MIT