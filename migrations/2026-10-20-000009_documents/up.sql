-- Documents: the identity index for a local workspace's folder. The folder on
-- disk holds the bytes; this table holds one row per document so each keeps a
-- stable id across renames (the studio tabs, detection runs, and restore all key
-- off it). See the policies migration for the shared table shape (lifted columns
-- plus an opaque JSON body). The body is the document's `WorkspaceDocument`
-- record; here the shared `name` column carries the file's path within the
-- folder, used to reconcile the index against the folder on each list.

CREATE TABLE documents (
    -- Identity
    id           TEXT NOT NULL PRIMARY KEY, -- stable document id (survives renames)
    workspace_id TEXT,                      -- owning workspace; NULL = unscoped

    -- Lifted columns the list query filters and sorts on
    name         TEXT,                      -- folder-relative path (the reconcile key)
    kind         TEXT,                      -- DocumentKind: original | redacted
    updated_at   TEXT NOT NULL,             -- ISO-8601 timestamp; keyset page order

    -- Payload
    body         TEXT NOT NULL              -- the WorkspaceDocument SDK JSON, verbatim
);

-- Lists are workspace-scoped.
CREATE INDEX documents_workspace_idx ON documents (workspace_id);
-- Keyset page order: newest first, id as the tie-break.
CREATE INDEX documents_page_idx ON documents (updated_at DESC, id DESC);
