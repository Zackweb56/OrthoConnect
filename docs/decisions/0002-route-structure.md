# 0002 — Platform Owner route prefix

- Status: accepted for the MVP.
- Context: route groups do not add URL segments, so both a Platform Owner
  and Cabinet `dashboard` would otherwise resolve to `/dashboard`.
- Decision: Platform Owner pages live below `/admin/*`; Cabinet pages keep
  their shorter URLs. The Owner dashboard is `/admin/dashboard`, while the
  Cabinet dashboard is `/dashboard`.
- Consequences: owner navigation links use `/admin/...`; route groups remain
  an implementation detail and do not affect public URLs.
