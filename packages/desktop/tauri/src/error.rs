//! Common error types

/// Boxed error type for dynamic dispatch
pub type BoxError = Box<dyn std::error::Error>;

/// Result type with BoxError
pub type BoxResult<T> = Result<T, BoxError>;
