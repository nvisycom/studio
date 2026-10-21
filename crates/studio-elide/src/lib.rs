#![forbid(unsafe_code)]
#![cfg_attr(docsrs, feature(doc_cfg))]
#![doc = include_str!("../README.md")]

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
