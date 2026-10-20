//! The store's data models.
//!
//! Unlike the server's `model` (one distinctly-shaped struct per entity), every
//! entity here shares ONE shape — the indexed columns plus the entity's opaque
//! JSON `body` — so a single [`Record`] crosses the API for every collection.
//! Diesel still needs a per-table struct (its derives name the table at compile
//! time), so the [`row`] macro expands the identical shape once per table, giving
//! each a distinct, table-named pair (`PoliciesRow` / `PoliciesNewRow`, …). They
//! are an implementation detail of [`crate::query`]; nothing outside names them.

use diesel::prelude::*;
use diesel::sqlite::Sqlite;

use crate::error::{Result, StoreError};

/// One stored entity as it crosses the store's API.
///
/// `body` is the entity's JSON, verbatim and opaque; the other fields are the
/// columns the store indexes. `name` and `kind` are optional because not every
/// collection has them.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Record {
    pub id: String,
    pub workspace_id: Option<String>,
    pub name: Option<String>,
    pub kind: Option<String>,
    pub updated_at: String,
    /// The entity's JSON body, as a string. Stored as-is.
    pub body: String,
}

/// A list query: which workspace, and where in the paginated list to read.
#[derive(Debug, Default, Clone)]
pub struct ListQuery {
    /// Restrict to one workspace, or list across all when `None`.
    pub workspace_id: Option<String>,
    /// Resume after this cursor (from a previous page's `next_cursor`).
    pub after: Option<String>,
    /// Maximum items in the page.
    pub limit: Option<i64>,
}

/// One page of records plus the cursor for the next, absent on the last page.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Page {
    pub items: Vec<Record>,
    pub next_cursor: Option<String>,
}

/// The default page size when a caller doesn't ask for one.
pub(crate) const DEFAULT_LIMIT: i64 = 100;
/// The largest page the store will return, whatever a caller asks for.
pub(crate) const MAX_LIMIT: i64 = 1000;

/// The effective page size for a query (defaulted and capped).
pub(crate) fn page_limit(limit: Option<i64>) -> i64 {
    limit.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT)
}

/// A keyset cursor: the `(updated_at, id)` of the last row on a page.
///
/// Encoded as `updated_at|id`. Timestamps are ISO-8601 and never contain `|`,
/// so the first `|` splits the two fields unambiguously.
pub(crate) struct Cursor {
    pub(crate) updated_at: String,
    pub(crate) id: String,
}

impl Cursor {
    /// The cursor pointing at a row, for the next page to resume after.
    pub(crate) fn encode(updated_at: &str, id: &str) -> String {
        format!("{updated_at}|{id}")
    }

    /// Parses a cursor this store issued, erroring on anything else.
    pub(crate) fn decode(raw: &str) -> Result<Self> {
        raw.split_once('|')
            .map(|(updated_at, id)| Self {
                updated_at: updated_at.to_owned(),
                id: id.to_owned(),
            })
            .ok_or_else(|| StoreError::Malformed(format!("invalid cursor `{raw}`")))
    }
}

/// Generates the diesel read/write row structs for one entity's `$table`, under
/// the given `$row` / `$new` names, plus their conversions to and from [`Record`].
/// The shape is identical across entities; only the table binding differs. The
/// names are passed explicitly (rather than concatenated) so no proc-macro helper
/// is needed, and so every row type lives in this one file without a module each.
macro_rules! row {
    ($row:ident, $new:ident, $table:ident) => {
        /// The row as diesel reads it from `$table`.
        #[derive(Queryable, Selectable)]
        #[diesel(table_name = crate::schema::$table)]
        #[diesel(check_for_backend(Sqlite))]
        pub(crate) struct $row {
            pub(crate) id: String,
            pub(crate) workspace_id: Option<String>,
            pub(crate) name: Option<String>,
            pub(crate) kind: Option<String>,
            pub(crate) updated_at: String,
            pub(crate) body: String,
        }

        /// The row as diesel writes it to `$table`.
        #[derive(Insertable)]
        #[diesel(table_name = crate::schema::$table)]
        pub(crate) struct $new {
            pub(crate) id: String,
            pub(crate) workspace_id: Option<String>,
            pub(crate) name: Option<String>,
            pub(crate) kind: Option<String>,
            pub(crate) updated_at: String,
            pub(crate) body: String,
        }

        impl From<$row> for Record {
            fn from(row: $row) -> Self {
                Self {
                    id: row.id,
                    workspace_id: row.workspace_id,
                    name: row.name,
                    kind: row.kind,
                    updated_at: row.updated_at,
                    body: row.body,
                }
            }
        }

        impl From<Record> for $new {
            fn from(record: Record) -> Self {
                Self {
                    id: record.id,
                    workspace_id: record.workspace_id,
                    name: record.name,
                    kind: record.kind,
                    updated_at: record.updated_at,
                    body: record.body,
                }
            }
        }
    };
}

// One row-struct pair per table. Identical shape, distinct table-named types.
row!(PoliciesRow, PoliciesNewRow, policies);
row!(ScopesRow, ScopesNewRow, scopes);
row!(MatchersRow, MatchersNewRow, matchers);
row!(LabelsRow, LabelsNewRow, labels);
row!(DetectionsRow, DetectionsNewRow, detections);
row!(RedactionsRow, RedactionsNewRow, redactions);
row!(WorkspacesRow, WorkspacesNewRow, workspaces);
row!(PipelinesRow, PipelinesNewRow, pipelines);
row!(DocumentsRow, DocumentsNewRow, documents);
