-- Matchers: the on-device custom matchers, one row per matcher. See the policies
-- migration for the shared table shape (lifted columns plus an opaque JSON body).

CREATE TABLE matchers (
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
CREATE INDEX matchers_workspace_idx ON matchers (workspace_id);
-- Keyset page order: newest first, id as the tie-break.
CREATE INDEX matchers_page_idx ON matchers (updated_at DESC, id DESC);
