//! The entity repositories.
//!
//! Unlike the server's `query` (one hand-written repository per entity, because
//! their columns differ), every entity here shares one shape, so each repository
//! is one expansion of the shared [`repo`] macro. The macro is type-checked
//! against that table's own diesel types — no runtime table-name interpolation,
//! no loss of type safety — and each repository's read/write row types are the
//! distinctly-named pair [`crate::model`] generated for that table.

use diesel::prelude::*;
use diesel::upsert::excluded;
use diesel_async::RunQueryDsl;

use crate::client::Store;
use crate::error::Result;
use crate::model::{Cursor, ListQuery, Page, Record, page_limit};

/// Generates the repository for one entity: a type borrowing the store, with the
/// list / get / upsert / delete queries against its `$table`, reading/writing via
/// that table's `$row` / `$new` structs (from [`crate::model`]).
macro_rules! repo {
    ($repo:ident, $table:ident, $row:ident, $new:ident) => {
        use crate::model::{$new, $row};

        /// The typed repository for this entity, borrowing the store.
        pub struct $repo<'a>(pub(crate) &'a Store);

        impl $repo<'_> {
            /// Lists one page of records, newest first, optionally scoped to a
            /// workspace.
            ///
            /// # Errors
            ///
            /// - A [`StoreError`](crate::StoreError) if the cursor is malformed or
            ///   the query fails.
            pub async fn list(&self, query: ListQuery) -> Result<Page> {
                use crate::schema::$table;
                use crate::schema::$table::dsl as t;

                let limit = page_limit(query.limit);
                let cursor = query.after.as_deref().map(Cursor::decode).transpose()?;
                let mut conn = self.0.connection.lock().await;

                // Fetch one extra row to tell whether another page exists.
                let mut select = $table::table.into_boxed();
                if let Some(ws) = query.workspace_id {
                    select = select.filter(t::workspace_id.eq(ws));
                }
                if let Some(cursor) = cursor {
                    // Strictly after the cursor row in (updated_at, id) DESC.
                    select = select.filter(
                        t::updated_at
                            .lt(cursor.updated_at.clone())
                            .or(t::updated_at.eq(cursor.updated_at).and(t::id.lt(cursor.id))),
                    );
                }
                let rows: Vec<$row> = select
                    .order((t::updated_at.desc(), t::id.desc()))
                    .limit(limit + 1)
                    .select($row::as_select())
                    .load(&mut *conn)
                    .await?;

                let mut items: Vec<Record> = rows.into_iter().map(Record::from).collect();
                let next_cursor = if items.len() as i64 > limit {
                    items.truncate(limit as usize);
                    items
                        .last()
                        .map(|last| Cursor::encode(&last.updated_at, &last.id))
                } else {
                    None
                };
                Ok(Page { items, next_cursor })
            }

            /// Fetches one record by id, or `None` if absent.
            ///
            /// # Errors
            ///
            /// - A [`StoreError`](crate::StoreError) if the query fails.
            pub async fn get(&self, id: &str) -> Result<Option<Record>> {
                use crate::schema::$table;

                let mut conn = self.0.connection.lock().await;
                let row: Option<$row> = $table::table
                    .find(id.to_owned())
                    .select($row::as_select())
                    .first(&mut *conn)
                    .await
                    .optional()?;
                Ok(row.map(Record::from))
            }

            /// Inserts or replaces a record (upsert on the primary key).
            ///
            /// # Errors
            ///
            /// - A [`StoreError`](crate::StoreError) if the write fails.
            pub async fn upsert(&self, record: Record) -> Result<()> {
                use crate::schema::$table;
                use crate::schema::$table::dsl as t;

                let new_row = $new::from(record);
                let mut conn = self.0.connection.lock().await;
                diesel::insert_into($table::table)
                    .values(&new_row)
                    .on_conflict(t::id)
                    .do_update()
                    .set((
                        t::workspace_id.eq(excluded(t::workspace_id)),
                        t::name.eq(excluded(t::name)),
                        t::kind.eq(excluded(t::kind)),
                        t::updated_at.eq(excluded(t::updated_at)),
                        t::body.eq(excluded(t::body)),
                    ))
                    .execute(&mut *conn)
                    .await?;
                Ok(())
            }

            /// Deletes a record by id. A no-op if it is absent.
            ///
            /// # Errors
            ///
            /// - A [`StoreError`](crate::StoreError) if the delete fails.
            pub async fn delete(&self, id: &str) -> Result<()> {
                use crate::schema::$table;

                let mut conn = self.0.connection.lock().await;
                diesel::delete($table::table.find(id.to_owned()))
                    .execute(&mut *conn)
                    .await?;
                Ok(())
            }
        }
    };
}

// One repository per entity. Each borrows the store and queries its own table.
repo!(Policies, policies, PoliciesRow, PoliciesNewRow);
repo!(Scopes, scopes, ScopesRow, ScopesNewRow);
repo!(Matchers, matchers, MatchersRow, MatchersNewRow);
repo!(Labels, labels, LabelsRow, LabelsNewRow);
repo!(Detections, detections, DetectionsRow, DetectionsNewRow);
repo!(Redactions, redactions, RedactionsRow, RedactionsNewRow);
repo!(Workspaces, workspaces, WorkspacesRow, WorkspacesNewRow);
repo!(Pipelines, pipelines, PipelinesRow, PipelinesNewRow);
repo!(Documents, documents, DocumentsRow, DocumentsNewRow);

/// The repository accessors on the store, one per entity (as the server's
/// `PgConnection` exposes one repository trait per entity).
impl Store {
    /// The policies repository.
    #[must_use]
    pub fn policies(&self) -> Policies<'_> {
        Policies(self)
    }
    /// The scopes repository.
    #[must_use]
    pub fn scopes(&self) -> Scopes<'_> {
        Scopes(self)
    }
    /// The matchers repository.
    #[must_use]
    pub fn matchers(&self) -> Matchers<'_> {
        Matchers(self)
    }
    /// The pipelines repository.
    #[must_use]
    pub fn pipelines(&self) -> Pipelines<'_> {
        Pipelines(self)
    }
    /// The labels repository.
    #[must_use]
    pub fn labels(&self) -> Labels<'_> {
        Labels(self)
    }
    /// The detections repository.
    #[must_use]
    pub fn detections(&self) -> Detections<'_> {
        Detections(self)
    }
    /// The redactions repository.
    #[must_use]
    pub fn redactions(&self) -> Redactions<'_> {
        Redactions(self)
    }
    /// The workspaces repository.
    #[must_use]
    pub fn workspaces(&self) -> Workspaces<'_> {
        Workspaces(self)
    }
    /// The documents repository (the identity index for a workspace's folder).
    #[must_use]
    pub fn documents(&self) -> Documents<'_> {
        Documents(self)
    }
}
