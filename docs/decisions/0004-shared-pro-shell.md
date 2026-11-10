# 0004 — Shared Professional shell

- Status: accepted for the MVP.
- Decision: one reusable `ProShell` presents the Professional palette and
  common sidebar/topbar structure for both Platform Owner and Cabinet
  workspaces. Its navigation is passed as serializable data, so each
  workspace can retain its own links while avoiding duplicated layout
  behavior.
- Platform Owner links use `/admin/*` as recorded in
  `0002-route-structure.md`; Cabinet keeps its own root-level routes.
