export { default as StudioDocumentPreview } from "./StudioDocumentPreview.vue";
export { default as PreviewChatToggle } from "./PreviewChatToggle.vue";
// The per-format view components (audio/image/CSV/text/DOCX) are internal to the
// renderer registry (see `renderers.ts`), which is the only thing that mounts
// them — not re-exported here.
