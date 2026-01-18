---
name: Rust
language: rust
filename: extract_document
extension: rs
githubUrl: https://github.com/nvisycom/sdk-rs
order: 3
---
```rust
use nvisy::{NvisyClient, ExtractDocument, Result};
use std::env;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize the client
    let client = NvisyClient::new(
        env::var("NVISY_API_KEY").expect("NVISY_API_KEY must be set")
    );

    // Extract structured data from a document
    let result = client.extract_documents(ExtractDocument {
        file: "./invoice.pdf".into(),
        extraction_types: vec!["INVOICE", "LINE_ITEMS", "TOTALS"],
        output_format: "json".into(),
    }).await?;

    println!("Document processed: {}", result.document_id);
    println!("Extracted data: {:?}", result.data);

    Ok(())
}
```
