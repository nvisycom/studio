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

// Redact sensitive data from a document
const result = await client.documents.redact({
  file: "./patient-record.pdf",
  entityTypes: ["PII", "PHI", "FINANCIAL"],
  strategy: "blackout",
});

console.log("Document redacted:", result.documentId);
console.log("Entities found:", result.entitiesRedacted);
```
