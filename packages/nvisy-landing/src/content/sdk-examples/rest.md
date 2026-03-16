---
name: Curl
language: bash
filename: redact-document
extension: sh
githubUrl: https://github.com/nvisycom/docs
order: 10
---

```bash
# Redact sensitive data from a document
curl -X POST https://api.nvisy.com/v1/documents/redact \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@./patient-record.pdf" \
  -F "entity_types=PII,PHI,FINANCIAL" \
  -F "strategy=blackout"

# Response
# {
#   "document_id": "doc_abc123",
#   "entities_redacted": 23,
#   "status": "completed"
# }
```
