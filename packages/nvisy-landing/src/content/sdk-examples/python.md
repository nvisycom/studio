---
name: Python
language: python
filename: extract_document
extension: py
githubUrl: https://github.com/nvisycom/sdk-py
order: 2
---

```python
from nvisy import NvisyClient
import os

# Initialize the client
client = NvisyClient(api_key=os.getenv('NVISY_API_KEY'))

# Extract structured data from a document
result = client.documents.extract(
    file='./invoice.pdf',
    extraction_types=['INVOICE', 'LINE_ITEMS', 'TOTALS'],
    output_format='json'
)

print(f'Document processed: {result.document_id}')
print(f'Extracted data: {result.data}')
```
