---
name: Python
language: python
filename: redact_document
extension: py
githubUrl: https://github.com/nvisycom/sdk-py
order: 2
---

```python
from nvisy import NvisyClient
import os

# Initialize the client
client = NvisyClient(api_key=os.getenv('NVISY_API_KEY'))

# Redact sensitive data from a document
result = client.documents.redact(
    file='./patient-record.pdf',
    entity_types=['PII', 'PHI', 'FINANCIAL'],
    strategy='blackout'
)

print(f'Document redacted: {result.document_id}')
print(f'Entities found: {result.entities_redacted}')
```
