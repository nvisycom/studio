-- Redactions: the results of on-device redaction runs, one row per redaction.
-- See the policies migration for the shared table shape (lifted columns plus an
-- opaque JSON body).

CREATE TABLE redactions (
    -- Identity
    id           TEXT NOT NULL PRIMARY KEY, -- entity id (the SDK's uuid)
    workspace_id TEXT,                      -- owning workspace; NULL = unscoped

    -- Lifted columns the list query filters and sorts on
    name         TEXT,                      -- display name, for search/sort
    kind         TEXT,                      -- entity subtype, for filtering
    updated_at   TEXT NOT NULL,             -- ISO-8601 timestamp; keyset page order

    -- Payload
    body         TEXT NOT NULL              -- the entity's SDK JSON, stored verbatim
);

-- Lists are workspace-scoped.
CREATE INDEX redactions_workspace_idx ON redactions (workspace_id);
-- Keyset page order: newest first, id as the tie-break.
CREATE INDEX redactions_page_idx ON redactions (updated_at DESC, id DESC);
