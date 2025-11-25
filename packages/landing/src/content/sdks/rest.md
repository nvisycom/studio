---
name: REST API
language: bash
filename: redact-document
extension: sh
githubUrl: https://github.com/nvisycom/api-docs
order: 3
---

```bash
# Redact a document
curl -X POST https://api.nvisy.com/v1/documents/redact \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@./sensitive-document.pdf" \
  -F "redaction_types=PII,PHI,CREDIT_CARD" \
  -F "output_format=pdf"

# Response
# {
#   "document_id": "doc_abc123",
#   "download_url": "https://api.nvisy.com/v1/documents/doc_abc123/download",
#   "status": "completed"
# }
```
