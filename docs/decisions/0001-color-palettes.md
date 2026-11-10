# 0001 — Color palettes and semantic tokens

- Status: accepted for the MVP.
- Source: founder-provided palettes and mappings.

## Professional palette

Used by Platform Owner, Cabinet, cabinet/owner authentication, and public
pages. It is the default palette at `:root`.

| Scale | Default | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| `space_indigo` | `#22223b` | `#07070c` | `#0d0d17` | `#141423` | `#1b1b2f` | `#22223b` | `#40406f` | `#6060a3` | `#9595c2` | `#cacae0` |
| `dusty_grape` | `#4a4e69` | `#0f1015` | `#1e1f2a` | `#2c2f3f` | `#3b3e54` | `#4a4e69` | `#666b8f` | `#8b8fac` | `#b1b4c8` | `#d8dae3` |
| `lilac_ash` | `#9a8c98` | `#1f1c1f` | `#3f383e` | `#5e535c` | `#7d6f7b` | `#9a8c98` | `#aea4ad` | `#c3bbc1` | `#d7d2d6` | `#ebe8ea` |
| `almond_silk` | `#c9ada7` | `#2e1f1c` | `#5b3e38` | `#895d54` | `#ad8279` | `#c9ada7` | `#d4bdb8` | `#dececa` | `#e9dedc` | `#f4efed` |
| `parchment` | `#f2e9e4` | `#3f2a1e` | `#7f543d` | `#b58165` | `#d3b5a4` | `#f2e9e4` | `#f4ede9` | `#f7f1ee` | `#faf6f4` | `#fcfaf9` |

| Semantic token | Value |
|---|---|
| `--primary` | `#22223b` |
| `--primary-hover` | `#40406f` |
| `--primary-fg` | `#f2e9e4` |
| `--text` / `--text-muted` | `#22223b` / `#4a4e69` |
| `--bg` / `--surface` / `--surface-soft` | `#f2e9e4` / `#fcfaf9` / `#f7f1ee` |
| `--border` / `--accent` / `--ring` | `#c9ada7` / `#9a8c98` / `#6060a3` |
| `--success` / `--warning` / `--danger` | `#195e56` / `#755912` / `#a43316` |
| `--radius` | `0.75rem` |

## Family palette

Used by the Family portal and `/family-login`; `.family-theme` overrides
the Professional semantic tokens.

| Scale | Default | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| `charcoal_blue` | `#264653` | `#080e11` | `#0f1c22` | `#172b32` | `#1f3943` | `#264653` | `#3f7489` | `#609db6` | `#95bece` | `#cadee7` |
| `verdigris` | `#2a9d8f` | `#081f1d` | `#113f39` | `#195e56` | `#217e73` | `#2a9d8f` | `#3acbba` | `#6cd8cb` | `#9de5dc` | `#cef2ee` |
| `tuscan_sun` | `#e9c46a` | `#3b2c09` | `#755912` | `#b0851a` | `#e0ad2e` | `#e9c46a` | `#edd086` | `#f1dca4` | `#f6e7c3` | `#faf3e1` |
| `sandy_brown` | `#f4a261` | `#401f04` | `#803e09` | `#c05e0d` | `#f07e22` | `#f4a261` | `#f6b681` | `#f8c8a1` | `#fbdac0` | `#fdede0` |
| `burnt_peach` | `#e76f51` | `#371107` | `#6e220f` | `#a43316` | `#db441e` | `#e76f51` | `#ec8b73` | `#f1a896` | `#f5c5b9` | `#fae2dc` |

| Semantic token | Value |
|---|---|
| `--primary` / `--primary-hover` / `--primary-fg` | `#217e73` / `#195e56` / `#ffffff` |
| `--text` / `--text-muted` | `#264653` / `#1f3943` |
| `--bg` / `--surface` / `--surface-soft` | `#faf3e1` / `#ffffff` / `#f6e7c3` |
| `--border` / `--accent` / `--accent-2` / `--ring` | `#f8c8a1` / `#e76f51` / `#e9c46a` / `#2a9d8f` |
| `--success` / `--warning` / `--danger` | `#195e56` / `#755912` / `#a43316` |
| `--radius` | `1.25rem` |

## Contrast and Tailwind naming

The suggested saturated status colors do not meet WCAG AA as body text on
the light canvases. The selected status text colors have these measured
contrast ratios:

| Foreground | Professional `#f2e9e4` | Family `#faf3e1` |
|---|---:|---:|
| Success `#195e56` | 6.32:1 | 6.83:1 |
| Warning `#755912` | 5.49:1 | 5.94:1 |
| Danger `#a43316` | 5.73:1 | 6.19:1 |

Family primary `#217e73` has 4.89:1 contrast with white button text. The
muted text colors are `#4a4e69` (Professional) and `#1f3943` (Family),
both above 4.5:1 on their canvases. Decorative accents are not used as
body text.

All source scales and semantic colors are registered in
`tailwind.config.js`. Semantic utility names avoid Tailwind's existing
`text-*` and `bg-*` prefixes: use `text-fg`, `text-muted`, `bg-canvas`,
`bg-surface`, `bg-surfaceSoft`, `border-line`, `ring-ring`, `bg-accent`,
`bg-accent2`, `text-success`, `text-warning`, and `text-danger`. Button
foreground uses `text-primary-fg`.

## Typography

The founder-selected Google fonts are Winky Sans for primary Latin UI,
Playwrite HU for handwritten notes, and Playpen Sans Arabic for Arabic
translations. They are loaded with `next/font/google` and self-hosted.
