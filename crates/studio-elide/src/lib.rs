//! The on-device redaction engine, built on the Elide runtime's stateless
//! [`Engine`](elide_pipeline::Engine).
//!
//! A [`LocalEngine`] is built once with the built-in local lineup (pattern
//! recognizers and language detection, no remote enrichment); the
//! deployment-TOML-configured lineup (the operator's NER/LLM/STT/OCR providers)
//! is a later step. Each call then drives detection ([`analyze`]) or redaction
//! ([`anonymize`]) against one document, entirely in-process, so the bytes
//! never leave the machine.
//!
//! The analyze/anonymize work is offloaded to a blocking thread: with the
//! default local lineup it is CPU-bound and never yields, so awaiting it on an
//! async worker would pin that thread for the whole pass. A model-backed lineup
//! still makes progress — the future is driven on the current runtime's handle,
//! so its network I/O reaches the reactor.
//!
//! [`analyze`]: LocalEngine::analyze
//! [`anonymize`]: LocalEngine::anonymize

#![forbid(unsafe_code)]

mod engine;

pub use crate::engine::LocalEngine;

// The elide types a host needs to drive a call, re-exported so it reaches them
// through this crate alone rather than depending on `elide-pipeline` directly:
// the document and audit, the policy / request-context / key inputs, the result
// and error types, and the `governance` (policy schema) and `provider` modules.
pub use elide_pipeline::entity::EditSet;
pub use elide_pipeline::file::Document;
pub use elide_pipeline::governance::policy::Policy;
pub use elide_pipeline::provider::{DocumentContext, KeyConfig, RequestContext};
pub use elide_pipeline::{Analyzed, Audit, Error, ErrorKind, Result};
pub use elide_pipeline::{governance, provider};
