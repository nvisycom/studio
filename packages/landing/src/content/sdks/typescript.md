---
name: TypeScript
language: typescript
filename: redact-document
extension: ts
githubUrl: https://github.com/nvisycom/sdk-ts
order: 1
---
```typescript
import { NvisyClient } from "@nvisy/sdk";

// Initialize the client
const client = new NvisyClient({
  apiKey: process.env.NVISY_API_KEY,
});

// Redact a document
const result = await client.documents.redact({
  file: "./sensitive-document.pdf",
  redactionTypes: ["PII", "PHI", "CREDIT_CARD"],
  outputFormat: "pdf",
});

console.log("Document redacted:", result.documentId);
console.log("Download URL:", result.downloadUrl);
```
