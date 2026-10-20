#![forbid(unsafe_code)]
#![cfg_attr(docsrs, feature(doc_cfg))]
#![doc = include_str!("../README.md")]

/// Embeds the schema migrations into the binary at build time. Reads the
/// workspace-root `migrations/` directory (resolved from this crate's manifest
/// dir), the same one the diesel CLI and `diesel.toml` use, so there is one
/// source of truth rather than a copy kept in step inside the crate.
pub(crate) const MIGRATIONS: diesel_migrations::EmbeddedMigrations =
    diesel_migrations::embed_migrations!("../../migrations");

mod client;
mod error;
mod model;
mod query;

// Diesel-generated shape; its `diesel::table!` blocks use wildcard sql-type
// imports, so the pedantic wildcard-imports lint is allowed here.
#[allow(clippy::wildcard_imports)]
mod schema;

pub use crate::client::Store;
pub use crate::error::{Result, StoreError};
pub use crate::model::{ListQuery, Page, Record};
pub use crate::query::{Detections, Labels, Matchers, Policies, Redactions, Scopes, Workspaces};

#[cfg(test)]
mod tests {
    use super::*;

    // The diesel-async migration harness uses `block_in_place`, which panics on a
    // single-threaded runtime (diesel_async#266), so every test runs multi-thread.

    /// A store over a unique temp-file database (diesel-async's SQLite wrapper
    /// does not support `:memory:` across its blocking-thread hops).
    async fn temp_store() -> (Store, std::path::PathBuf) {
        let dir = std::env::temp_dir().join(format!(
            "studio-sqlite-{}-{:?}",
            std::process::id(),
            std::thread::current().id()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("store.db");
        let store = Store::open(&path).await.expect("open");
        (store, dir)
    }

    fn record(id: &str, updated_at: &str) -> Record {
        Record {
            id: id.to_owned(),
            workspace_id: Some("ws".to_owned()),
            name: Some(format!("name-{id}")),
            kind: Some("authored".to_owned()),
            updated_at: updated_at.to_owned(),
            body: format!("{{\"id\":\"{id}\"}}"),
        }
    }

    /// Opening runs migrations; a fresh collection lists empty, proving the table
    /// (and its indexes) exist.
    #[tokio::test(flavor = "multi_thread")]
    async fn opens_and_migrates() {
        let (store, dir) = temp_store().await;
        let page = store
            .policies()
            .list(ListQuery::default())
            .await
            .expect("list");
        assert!(page.items.is_empty());
        assert!(page.next_cursor.is_none());
        std::fs::remove_dir_all(&dir).ok();
    }

    /// Upsert replaces on the primary key; get reads it back; delete removes it.
    #[tokio::test(flavor = "multi_thread")]
    async fn upsert_get_delete_round_trip() {
        let (store, dir) = temp_store().await;
        let policies = store.policies();
        policies
            .upsert(record("a", "2026-01-01T00:00:00Z"))
            .await
            .expect("insert");
        policies
            .upsert(record("a", "2026-02-01T00:00:00Z"))
            .await
            .expect("replace");

        let got = policies.get("a").await.expect("get").expect("present");
        assert_eq!(got.updated_at, "2026-02-01T00:00:00Z");

        policies.delete("a").await.expect("delete");
        assert!(policies.get("a").await.expect("get").is_none());
        std::fs::remove_dir_all(&dir).ok();
    }

    /// Entities are isolated by table: a policy is not visible as a scope.
    #[tokio::test(flavor = "multi_thread")]
    async fn collections_are_separate_tables() {
        let (store, dir) = temp_store().await;
        store
            .policies()
            .upsert(record("x", "2026-01-01T00:00:00Z"))
            .await
            .unwrap();
        assert!(store.policies().get("x").await.unwrap().is_some());
        assert!(store.scopes().get("x").await.unwrap().is_none());
        std::fs::remove_dir_all(&dir).ok();
    }

    /// Keyset pagination returns each row once across pages, newest-first.
    #[tokio::test(flavor = "multi_thread")]
    async fn paginates_without_gaps_or_repeats() {
        let (store, dir) = temp_store().await;
        let policies = store.policies();
        for n in 0..5 {
            policies
                .upsert(record(
                    &format!("p{n}"),
                    &format!("2026-01-0{}T00:00:00Z", n + 1),
                ))
                .await
                .unwrap();
        }

        let mut seen = Vec::new();
        let mut after: Option<String> = None;
        loop {
            let page = policies
                .list(ListQuery {
                    workspace_id: Some("ws".to_owned()),
                    after: after.clone(),
                    limit: Some(2),
                })
                .await
                .expect("list");
            seen.extend(page.items.iter().map(|r| r.id.clone()));
            match page.next_cursor {
                Some(cursor) => after = Some(cursor),
                None => break,
            }
        }
        assert_eq!(seen, ["p4", "p3", "p2", "p1", "p0"]);
        std::fs::remove_dir_all(&dir).ok();
    }

    /// Re-opening the same database does not re-run migrations and keeps data.
    #[tokio::test(flavor = "multi_thread")]
    async fn reopen_is_idempotent() {
        let dir = std::env::temp_dir().join(format!("studio-sqlite-reopen-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("store.db");

        {
            let store = Store::open(&path).await.expect("first open");
            store
                .policies()
                .upsert(record("keep", "2026-01-01T00:00:00Z"))
                .await
                .unwrap();
        }
        let store = Store::open(&path).await.expect("reopen");
        assert!(store.policies().get("keep").await.unwrap().is_some());
        std::fs::remove_dir_all(&dir).ok();
    }
}
