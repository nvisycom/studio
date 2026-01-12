# Dropbox Components

This folder contains all components related to the Dropbox integration.

## Structure

- `ConnectDropboxDialog.vue` - Dialog for connecting to Dropbox
- `ConfigureDropboxDialog.vue` - Dialog for configuring Dropbox settings
- `DropboxSettings.vue` - Settings panel for Dropbox
- Other Dropbox-specific components

## Usage

Components in this folder should be imported from the main integrations barrel
export:

```typescript
import { ConnectDropboxDialog } from "@/components/integrations";
```
