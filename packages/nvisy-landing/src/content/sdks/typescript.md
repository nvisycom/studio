---
name: TypeScript
language: typescript
filename: extract-document
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

// Extract structured data from a document
const result = await client.documents.extract({
  file: "./invoice.pdf",
  extractionTypes: ["INVOICE", "LINE_ITEMS", "TOTALS"],
  outputFormat: "json",
});

console.log("Document processed:", result.documentId);
console.log("Extracted data:", result.data);
```
