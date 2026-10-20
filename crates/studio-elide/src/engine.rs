//! The on-device redaction engine.

use elide_pipeline::Engine;
use elide_pipeline::provider::{Deployment, Provider};

use crate::{
    Analyzed, Audit, Document, EditSet, Error, ErrorKind, KeyConfig, Policy, RequestContext, Result,
};

/// The on-device redaction engine.
///
/// Cheaply cloneable: the underlying [`Engine`] is `Arc`-backed, so every clone
/// shares one configured codec registry and recognizer lineup. Hold one for the
/// app's lifetime and clone it per request.
#[derive(Clone)]
#[must_use = "a LocalEngine does nothing until you analyze or anonymize with it"]
pub struct LocalEngine {
    engine: Engine,
}

impl LocalEngine {
    /// Builds the engine with the built-in local lineup and no remote
    /// enrichment — pattern recognizers and language detection only.
    ///
    /// The deployment-TOML-configured lineup (the operator's NER/LLM/STT/OCR
    /// providers) is a later step; this is the lineup that needs no config.
    pub fn local() -> Self {
        Self {
            engine: Engine::new(Provider::new(Deployment::default())),
        }
    }

    /// Reads an [`Audit`] back from its serialized form.
    ///
    /// An audit is `Serialize` but not `Deserialize`: its report tags entity
    /// groups by modality name, so rebuilding one needs this engine's codec
    /// registry. The frontend sends a detection's audit back (with any reviewer
    /// edits) as JSON for redaction; this turns it back into an [`Audit`] the
    /// same engine can apply.
    ///
    /// # Errors
    ///
    /// - A [`MalformedInput`](ErrorKind::MalformedInput) error if the value is
    ///   not a well-formed serialized audit.
    pub fn deserialize_audit(&self, audit: serde_json::Value) -> Result<Audit> {
        self.engine.deserialize_audit(audit)
    }

    /// Detects over one document, returning the reviewable [`Analyzed`] result.
    ///
    /// Runs on a blocking thread; see the crate docs for why.
    ///
    /// # Errors
    ///
    /// - A [`Processing`](ErrorKind::Processing) error if the blocking task
    ///   panics or is cancelled.
    /// - Any error [`Engine::analyze`] itself produces (an unsupported or
    ///   undecodable document, a recognizer backend failure).
    pub async fn analyze(
        &self,
        document: Document,
        policies: Vec<Policy>,
        request: RequestContext,
    ) -> Result<Analyzed> {
        self.on_blocking(move |engine| async move {
            engine.analyze(document, &policies, &request).await
        })
        .await
    }

    /// Applies an [`Audit`] to one document, returning the redacted bytes as a
    /// new [`Document`].
    ///
    /// `audit` is the [`Analyzed::audit`] a prior [`analyze`](Self::analyze)
    /// produced. `edits` are the reviewer's decisions (keep / suppress / add /
    /// retag) to fold into the audit's report before redacting — validated and
    /// applied here, as the server does, so a reviewer is never told a decision
    /// took effect when the document says otherwise. `key` supplies the secret
    /// for keyed operators (HMAC, AES) when a policy uses one; pass `None`
    /// otherwise.
    ///
    /// Runs on a blocking thread; see the crate docs for why.
    ///
    /// # Errors
    ///
    /// - A [`MalformedInput`](ErrorKind::MalformedInput) error if an edit does
    ///   not validate against the audit's report (it names an entity the report
    ///   does not carry, contradicts itself, or targets the wrong modality).
    /// - A [`Processing`](ErrorKind::Processing) error if the blocking task
    ///   panics or is cancelled.
    /// - Any error [`Engine::anonymize`] itself produces (an audit that
    ///   describes no analyzed document, an undecodable document, a keyed
    ///   operator with no key).
    pub async fn anonymize(
        &self,
        document: Document,
        policies: Vec<Policy>,
        mut audit: Audit,
        edits: Option<EditSet>,
        key: Option<KeyConfig>,
    ) -> Result<Document> {
        // Fold reviewer edits into the report before redacting, exactly as the
        // server does. `validate` catches a contradictory or out-of-report edit
        // up front; `apply` can still fail when an edit lands against the wrong
        // modality.
        if let Some(edits) = edits {
            edits
                .validate(&audit.report)
                .map_err(|err| Error::new(ErrorKind::MalformedInput, err))?;
            edits
                .apply(&mut audit.report)
                .map_err(|err| Error::new(ErrorKind::MalformedInput, err))?;
        }
        self.on_blocking(move |engine| async move {
            engine
                .anonymize(document, &policies, &mut audit, key.as_ref())
                .await
        })
        .await
    }

    /// Drives `work` on a blocking thread against a clone of the engine.
    ///
    /// The clone is cheap (the engine is `Arc`-backed) and shares one configured
    /// lineup. The future is polled on the current runtime's handle so a
    /// model-backed lineup's network I/O still reaches the reactor, while the
    /// local lineup runs to completion on the first poll off the async workers.
    async fn on_blocking<F, Fut, T>(&self, work: F) -> Result<T>
    where
        F: FnOnce(Engine) -> Fut + Send + 'static,
        Fut: Future<Output = Result<T>>,
        T: Send + 'static,
    {
        let engine = self.engine.clone();
        let handle = tokio::runtime::Handle::current();
        tokio::task::spawn_blocking(move || handle.block_on(work(engine)))
            .await
            .map_err(|err| Error::new(ErrorKind::Processing, err))?
    }
}
