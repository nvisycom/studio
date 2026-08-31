export { default as StudioDocumentPreview } from "./StudioDocumentPreview.vue";
// The per-format view components (image/CSV/text/DOCX) are not exported here:
// they're internal to the renderer registry (see `renderers.ts`), which is the
// only thing that mounts them, and the CSV table / code view they compose from.
export { default as EntityDetailPopover } from "./EntityDetailPopover.vue";
export { default as StudioChatPanel } from "./StudioChatPanel.vue";
export { default as StudioAuditPanel } from "./StudioAuditPanel.vue";
export { default as StudioDetectionBar } from "./StudioDetectionBar.vue";
export { default as ChatMessage } from "./ChatMessage.vue";
export { default as MessageInput } from "./MessageInput.vue";
