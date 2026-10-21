//! The diesel schema: one `table!` per entity.
//!
//! Every entity is its own table (like the server's Postgres models), so each is
//! a distinct diesel type and its queries are type-checked. The tables share an
//! identical column shape — an id, the workspace, the indexed `name`/`kind`, the
//! `updated_at` the list orders on, and the opaque JSON `body` — so the row model
//! and the repository body are written once and expanded per table (see
//! `entity!` in `lib.rs`).
//!
//! Kept in step with the migrations by hand (this crate doesn't run diesel-cli):
//! a column change is a new migration plus the matching edit here.

diesel::table! {
    policies (id) {
        id -> Text,
        workspace_id -> Nullable<Text>,
        name -> Nullable<Text>,
        kind -> Nullable<Text>,
        updated_at -> Text,
        body -> Text,
    }
}

diesel::table! {
    pipelines (id) {
        id -> Text,
        workspace_id -> Nullable<Text>,
        name -> Nullable<Text>,
        kind -> Nullable<Text>,
        updated_at -> Text,
        body -> Text,
    }
}

diesel::table! {
    scopes (id) {
        id -> Text,
        workspace_id -> Nullable<Text>,
        name -> Nullable<Text>,
        kind -> Nullable<Text>,
        updated_at -> Text,
        body -> Text,
    }
}

diesel::table! {
    matchers (id) {
        id -> Text,
        workspace_id -> Nullable<Text>,
        name -> Nullable<Text>,
        kind -> Nullable<Text>,
        updated_at -> Text,
        body -> Text,
    }
}

diesel::table! {
    labels (id) {
        id -> Text,
        workspace_id -> Nullable<Text>,
        name -> Nullable<Text>,
        kind -> Nullable<Text>,
        updated_at -> Text,
        body -> Text,
    }
}

diesel::table! {
    detections (id) {
        id -> Text,
        workspace_id -> Nullable<Text>,
        name -> Nullable<Text>,
        kind -> Nullable<Text>,
        updated_at -> Text,
        body -> Text,
    }
}

diesel::table! {
    redactions (id) {
        id -> Text,
        workspace_id -> Nullable<Text>,
        name -> Nullable<Text>,
        kind -> Nullable<Text>,
        updated_at -> Text,
        body -> Text,
    }
}

diesel::table! {
    workspaces (id) {
        id -> Text,
        workspace_id -> Nullable<Text>,
        name -> Nullable<Text>,
        kind -> Nullable<Text>,
        updated_at -> Text,
        body -> Text,
    }
}

diesel::table! {
    documents (id) {
        id -> Text,
        workspace_id -> Nullable<Text>,
        name -> Nullable<Text>,
        kind -> Nullable<Text>,
        updated_at -> Text,
        body -> Text,
    }
}
