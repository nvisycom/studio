-- Workspaces: the on-device local workspaces, one row per workspace. See the
-- policies migration for the shared table shape (lifted columns plus an opaque
-- JSON body). A workspace has no parent workspace, so `workspace_id` stays NULL
-- and there is no workspace index — only the keyset page index.

CREATE TABLE workspaces (
    -- Identity
    id           TEXT NOT NULL PRIMARY KEY, -- entity id (the SDK's uuid)
    workspace_id TEXT,                      -- always NULL (a workspace has no parent)

    -- Lifted columns the list query filters and sorts on
    name         TEXT,                      -- display name, for search/sort
    kind         TEXT,                      -- entity subtype, for filtering
    updated_at   TEXT NOT NULL,             -- ISO-8601 timestamp; keyset page order

    -- Payload
    body         TEXT NOT NULL              -- the entity's SDK JSON, stored verbatim
);

-- Keyset page order: newest first, id as the tie-break. (No workspace index:
-- workspaces are not workspace-scoped.)
CREATE INDEX workspaces_page_idx ON workspaces (updated_at DESC, id DESC);
