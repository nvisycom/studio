# On-device store migrations

The schema migrations for the desktop app's local SQLite store (the
`studio-sqlite` crate). One migration per entity, each a `up.sql` / `down.sql`
pair, embedded into the desktop binary at build time (`embed_migrations!`) and
applied on the user's device when the store is first opened or upgraded.

## Guidelines

- Migrations are append-only. Once a migration is merged into `main`, do not
  modify it — existing databases on users' machines have already run it.
- Add a schema change as a new timestamped migration directory, and update the
  matching `crates/studio-sqlite/src/schema.rs` by hand (this crate doesn't run
  `diesel migration run` to regenerate it).
- Every entity table shares the same shape: `(id, workspace_id, name, kind,
  updated_at, body)`, where `body` is the entity's SDK JSON stored verbatim and
  the other columns are what the UI filters and sorts on. See the first
  (`_policies`) migration for the fully-documented shape and its indexes; the
  others reference it and document only what differs.

## SQL style

Mirrors the server's Postgres migrations (`../server/migrations`), minus the
Postgres-only features SQLite lacks:

- A prose header comment states the table's purpose.
- Columns are aligned and grouped by section comment (`-- Identity`, `-- Lifted
  columns …`, `-- Payload`), each with an inline `-- explanation`.
- `COMMENT ON TABLE` / `COMMENT ON COLUMN` are Postgres DDL (invalid in SQLite),
  so that documentation lives in the inline column comments instead.
- `down.sql` reverts with `DROP TABLE IF EXISTS` (SQLite drops a table's indexes
  with it, so they need no separate drop).
