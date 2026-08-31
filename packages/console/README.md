# @nvisy/console

[![Build](https://img.shields.io/github/actions/workflow/status/nvisycom/studio/build.yml?branch=main&label=build%20%26%20test&style=flat-square)](https://github.com/nvisycom/studio/actions/workflows/build.yml)

Shared Nuxt layer holding the entire console dashboard surface.

## Overview

The heart of the console. This layer owns everything the web and desktop apps
render in common: the shadcn-vue design system, the feature views (studio,
workflows, files, connections, …), the `@nvisy/sdk` data layer, theme CSS, and
i18n. The apps ([`@nvisy/webapp`](../../apps/web/),
[`@nvisy/desktop`](../../apps/desktop/)) contribute only their own shell and
consume everything here.

Apps opt in with `extends: ["@nvisy/console"]` in their `nuxt.config.ts`. Nuxt
merges the layer's `components/`, `composables/`, `utils/`, `plugins/`, and
`i18n/` into each app, so auto-imports work across the layer.

## Conventions

- **Imports.** Inside the layer, reference shared code through the `#console`
  alias (e.g. `import { Button } from "#console/components/ui/button"`) so paths
  resolve identically in every app. Each app's `@/` and `~/` point at its own
  `app/` srcDir, not the layer's.
- **Design system.** New shadcn-vue components generate here per
  `components.json` — run `npm run shadcn:add -w @nvisy/console <name>`.
- **Formatting.** Biome, TAB indentation, double quotes.

## License

GNU Affero General Public License v3.0 (AGPL-3.0), see [LICENSE.txt](../../LICENSE.txt)

## Support

- **Documentation**: [docs.nvisy.com](https://docs.nvisy.com)
- **Issues**: [GitHub Issues](https://github.com/nvisycom/studio/issues)
- **Email**: [support@nvisy.com](mailto:support@nvisy.com)
