/// <reference types="vite/client" />

// Pulls in Vite's asset-module declarations (`declare module '*?url'`, etc.) so
// `import workerSrc from "pkg/file?url"` typechecks in the layer. The PDF preview
// (`PdfView.vue`) uses the `?url` form to emit pdf.js's worker as an asset
// on our own origin.
