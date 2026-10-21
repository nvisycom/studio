//! The store's error type.

/// A failure opening or using the store.
#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    /// The database could not be opened.
    #[error("could not open the store: {0}")]
    Open(String),
    /// A migration could not be applied.
    #[error("migration error: {0}")]
    Migration(String),
    /// A query or write failed.
    #[error(transparent)]
    Query(#[from] diesel::result::Error),
    /// A cursor or stored value was not the shape a caller expected.
    #[error("malformed: {0}")]
    Malformed(String),
}

/// The store's result type.
pub type Result<T> = std::result::Result<T, StoreError>;
