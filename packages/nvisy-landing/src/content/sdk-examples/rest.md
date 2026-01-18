---
name: REST API
language: bash
filename: extract-document
extension: sh
githubUrl: https://github.com/nvisycom/docs
order: 10
---

```bash
# Extract structured data from a document
curl -X POST https://api.nvisy.com/v1/documents/extract \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@./invoice.pdf" \
  -F "extraction_types=INVOICE,LINE_ITEMS,TOTALS" \
  -F "output_format=json"

# Response
# {
#   "document_id": "doc_abc123",
#   "data": { ... },
#   "status": "completed"
# }
```
