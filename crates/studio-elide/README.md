# studio-elide

The on-device redaction engine, built on the Elide runtime's stateless `Engine`.

A `LocalEngine` is built once with the built-in local lineup (pattern
recognizers and language detection, no remote enrichment); the
deployment-TOML-configured lineup (the operator's NER/LLM/STT/OCR providers)
is a later step. Each call then drives detection (`analyze`) or redaction
(`anonymize`) against one document, entirely in-process, so the bytes never
leave the machine.

The analyze/anonymize work is offloaded to a blocking thread: with the
default local lineup it is CPU-bound and never yields, so awaiting it on an
async worker would pin that thread for the whole pass. A model-backed lineup
still makes progress — the future is driven on the current runtime's handle,
so its network I/O reaches the reactor.
