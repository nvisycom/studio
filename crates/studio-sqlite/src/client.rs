//! The SQLite client: opening the database and running migrations.
//!
//! SQLite has no async C API, so the async surface is diesel-async's
//! `SyncConnectionWrapper`, which runs each query on a blocking thread. A desktop
//! app is single-user with little contention, so one connection behind a mutex is
//! simpler than a pool and still correct. Migrations use the synchronous diesel
//! harness, wrapped to present the sync `Connection` it wants and run off the
//! async executor.

use std::path::Path;

use diesel::sqlite::SqliteConnection;
use diesel_async::AsyncConnection;
use diesel_async::async_connection_wrapper::AsyncConnectionWrapper;
use diesel_async::sync_connection_wrapper::SyncConnectionWrapper;
use diesel_migrations::MigrationHarness;
use tokio::sync::Mutex;

use crate::MIGRATIONS;
use crate::error::{Result, StoreError};

/// The async connection type: diesel's sync SQLite connection behind the async
/// wrapper that runs it on a blocking thread.
pub(crate) type Conn = SyncConnectionWrapper<SqliteConnection>;

/// The on-device store: one embedded database and a single serialized
/// connection.
pub struct Store {
    pub(crate) connection: Mutex<Conn>,
}

impl Store {
    /// Opens (creating if absent) the database at `path` and runs any pending
    /// migrations.
    ///
    /// The caller owns where the file lives (on desktop, under the app's data
    /// directory) and creates any parent directories. Migrations run on a
    /// blocking thread via the sync migration harness, then a fresh connection
    /// is opened for queries.
    ///
    /// # Errors
    ///
    /// - A [`StoreError`] if the database can't be opened or a migration can't be
    ///   applied.
    pub async fn open(path: impl AsRef<Path>) -> Result<Self> {
        let path = path.as_ref().to_string_lossy().into_owned();

        // Migrations use the synchronous diesel harness; wrap the async
        // connection to present the sync `Connection` it wants, and run it off
        // the async executor. The wrapper consumes the connection, so a fresh one
        // is opened afterward for queries.
        let migration_conn = Conn::establish(&path)
            .await
            .map_err(|err| StoreError::Open(err.to_string()))?;
        run_migrations(migration_conn).await?;

        let connection = Conn::establish(&path)
            .await
            .map_err(|err| StoreError::Open(err.to_string()))?;
        Ok(Self {
            connection: Mutex::new(connection),
        })
    }
}

/// Runs every pending migration against `connection`, on a blocking thread.
async fn run_migrations(connection: Conn) -> Result<()> {
    let mut wrapper: AsyncConnectionWrapper<Conn> = AsyncConnectionWrapper::from(connection);
    tokio::task::spawn_blocking(move || {
        wrapper
            .run_pending_migrations(MIGRATIONS)
            .map(|_versions| ())
            .map_err(|err| StoreError::Migration(err.to_string()))
    })
    .await
    .map_err(|err| StoreError::Migration(err.to_string()))?
}
