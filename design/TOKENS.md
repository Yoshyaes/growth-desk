# Growth Desk design tokens

Extracted from the mockups in `design/mockups/`. These values are canonical.
The implementation in `app/globals.css` must match them exactly.

## Color

| Token | Light | Dark |
|---|---|---|
| ground | `#ECEEF0` | `#111417` |
| surface | `#F8F9FA` | `#191D21` |
| surface-sunk | `#E2E5E8` | `#0C0E10` |
| ink | `#15181B` | `#E7EAEC` |
| ink-muted | `#545C63` | `#9BA3A9` |
| ink-faint | `#7C858C` | `#7A828A` |
| rule | `#CFD4D8` | `#2B3136` |
| accent | `#33406B` | `#8B9AD1` |
| accent-hover | `#2A3558` | `#A9B5DD` |
| accent-soft | `#DCE0EC` | `#1D2334` |

## Gate semantics

These three carry information. They are never used for a button, a heading,
a hover state, or anything decorative.

| State | Light fg | Light bg | Dark fg | Dark bg |
|---|---|---|---|---|
| open | `#3F6B4A` | `#DEE8E0` | `#86B392` | `#1B2620` |
| restricted | `#8A6A16` | `#EFE6CC` | `#D4B266` | `#2C2512` |
| blocked | `#9B3B2C` | `#F1DED9` | `#DB8E7E` | `#2E1C18` |

## Type

| Role | Family |
|---|---|
| UI, headings, labels | Familjen Grotesk, Helvetica Neue, Arial, sans-serif |
| Drafts, move ids, all numbers | JetBrains Mono, ui-monospace, Menlo, monospace |

No third face.

Draft copy renders in JetBrains Mono on purpose. It signals raw text about to
be copied into someone else's textarea, not designed content.

Uppercase labels are 11px, weight 700, letter-spacing 0.12em.
Every column of numbers uses `font-variant-numeric: tabular-nums`.

## Geometry

| Property | Value |
|---|---|
| Radius | 4px everywhere it appears. Never larger |
| Left rail | 220px fixed |
| Right inspector | 320px fixed, never collapsible |
| Main content max | 780px |
| Gradients | none |
| Elevated objects | move cards only |

## Move lifecycle

The mockups establish four states for a move.

`queued` -> `drafted` -> `copied` -> `skipped`

The app cannot know whether Fred actually posted. It knows he copied.
`copied` is the proxy for sent, and `gd log` records what happened after.
