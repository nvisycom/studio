-- Policies: the on-device redaction policies, one row per policy.
--
-- This is the canonical table for the local store's shared shape. Every entity
-- table is identical: a stable id, the workspace it belongs to, a couple of
-- columns the UI filters and sorts on (name, kind), when the row last changed,
-- and the entity's own JSON body stored verbatim. The body's shape is owned by
-- the SDK types, not here; only the lifted columns are indexed. The other
-- migrations reference this one for the shape and document only what differs.

CREATE TABLE policies (
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
CREATE INDEX policies_workspace_idx ON policies (workspace_id);
-- Keyset page order: newest first, id as the tie-break.
CREATE INDEX policies_page_idx ON policies (updated_at DESC, id DESC);
