---
name: Rust
language: rust
filename: redact_document
extension: rs
githubUrl: https://github.com/nvisycom/sdk-rs
order: 3
---
```rust
use nvisy::{NvisyClient, RedactDocument, Result};
use std::env;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize the client
    let client = NvisyClient::new(
        env::var("NVISY_API_KEY").expect("NVISY_API_KEY must be set")
    );

    // Redact sensitive data from a document
    let result = client.redact_document(RedactDocument {
        file: "./patient-record.pdf".into(),
        entity_types: vec!["PII", "PHI", "FINANCIAL"],
        strategy: "blackout".into(),
    }).await?;

    println!("Document redacted: {}", result.document_id);
    println!("Entities found: {}", result.entities_redacted);

    Ok(())
}
```
