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

# Redact a document
result = client.documents.redact(
    file='./sensitive-document.pdf',
    redaction_types=['PII', 'PHI', 'CREDIT_CARD'],
    output_format='pdf'
)

print(f'Document redacted: {result.document_id}')
print(f'Download URL: {result.download_url}')
```
