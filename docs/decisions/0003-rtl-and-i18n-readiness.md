# 0003 — RTL and internationalization readiness

- Status: accepted for the MVP.
- Decision: the root document uses `lang="fr"` and `dir="ltr"`. UI spacing
  and positioning should prefer logical properties and Tailwind utilities
  (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) over physical
  left/right variants.
- Arabic translations use the dedicated Playpen Sans Arabic font and an
  `.arabic-text` class that isolates RTL direction at the text level. This
  is preparation only, not full bidirectional layout or localization.
- Full RTL and i18n are deferred to Phase 13.
