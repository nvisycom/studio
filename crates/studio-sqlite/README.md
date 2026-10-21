# studio-sqlite

The console's on-device entity store.

The console is normally server-backed through the SDK. On desktop the app
must also work with no account and no server, so the entities a workspace is
built from — policies, scopes, matchers, labels — and the results of
on-device runs — detections, redactions — are persisted locally here and
served through the same repository interface the SDK fills on the web.

The crate is organized like the server's `nvisy-postgres`: a `client` that
opens the database and runs migrations, a `model` of the stored shapes, a
`query` of one repository per entity, and the diesel `schema`. The difference
is that every entity shares one table shape — the indexed columns plus the
entity's opaque JSON `body`, whose shape the SDK types own — so the model and
the repository are written once and expanded per table rather than hand-written
per entity. The body is stored verbatim, so the local and server repositories
stay interchangeable without a second schema.

The store is Tauri-agnostic: it opens a path and exposes typed repositories;
the desktop shell wraps each as a command.
