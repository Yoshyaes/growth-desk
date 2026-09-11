# Growth Desk. Development plan

**From** the PRD in `docs/PRD.md` and the fifteen artboards in `design/mockups/`
**Date** 11 September 2026
**Status** Phase A in progress

---

## The architectural decision this plan has to make first

The PRD argued hard for no web app. No database, no auth, no deploy, on the
grounds that a single-operator tool whose main consumer is an LLM should be a
folder of well-structured text.

That argument is still right, and building a UI does not overturn it. The
resolution is that **the app is local-first and file-backed.**

- The markdown, YAML and CSV under `products/` stay the single source of truth.
- The app reads and writes those exact files. It introduces no database.
- Git history, Claude Code access, diffability and portability all survive.
- Nothing is hosted. `npm run dev` is the whole deploy story. It binds to
  localhost and has no auth because it has no remote surface.

What the UI buys over the CLI is the thing the CLI cannot do. It puts the
constraints on screen. The gate, the cadence caps, the voice lint and the
proof citations sit in a permanent inspector instead of living in files
nobody opens mid-task.

If this ever needs a second operator, that is the moment to revisit. Not before.

---

## Stack

**Zero runtime dependencies.** The application is plain Node 22 with a
handwritten HTTP server, server-rendered HTML, and one small client script.
There is no `node_modules` directory and no build step.

Two reasons, in order of weight.

The first is fit. This repo already argues that the heaviest thing in it
should be the writing. The `gd` CLI is already zero-dependency. A local,
single-operator tool that reads its own markdown does not need a framework,
and every dependency added here is one more thing that can rot, break on a
Node upgrade, or need a security patch on a Saturday.

The second is that the npm registry is unreachable from the environment this
was built in, which forced the question early rather than late.

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node 22, `node:http` | Already installed. Nothing to add |
| Rendering | Server-rendered HTML from template functions | The mockups are HTML with inline styles. Rendering them server-side is a direct translation, not a port |
| Styling | One handwritten stylesheet from `design/TOKENS.md` | Every token value is canonical and checked against the mockups |
| Client JS | One file, roughly 100 lines, no framework | Copy, skip, theme, live lint. That is the whole interaction surface |
| YAML | `lib/yaml-lite.js`, handwritten, tested | Covers the shapes this repo actually uses. Tested against all three real files |
| Validation | Handwritten, in `lib/repo.js` and the test suite | The tests validate the real repo on every run, so a malformed file fails immediately |
| Tests | `node:test`, built in | `node --test` and nothing else |
| Database | none | The files under `products/` are the database |
| Auth | none | Binds to 127.0.0.1 |

**The migration path, if it is ever needed.** Every page is a pure function
from repo state to an HTML string, and every read and write goes through
`lib/repo.js`. Swapping the render layer for React or Next.js later touches
`server/pages/` and nothing else. The gate, the lint and the repo layer move
across unchanged. That is the reason the code is split the way it is.

---|---|---|
| Framework | Next.js 15, App Router | Server Components read the filesystem directly, so there is no API layer to write. Fred already ships on this stack |
| Language | TypeScript, strict | The file schemas are the contract. Types enforce them |
| UI | React 19 | Comes with the framework |
| Styling | Tailwind v4 with `@theme` tokens | The mockup tokens map one to one onto CSS custom properties |
| Parsing | `yaml`, `gray-matter`, `zod` | Channels are YAML, product files are markdown, everything validates at the boundary |
| Writes | Server Actions | No API routes for mutations |
| Tests | Vitest | The gate needs a test suite more than the UI does |
| Database | none | The files are the database |
| Auth | none | Binds to 127.0.0.1 |

---

## One amendment to the PRD

The PRD's eight-file product folder has no place for generated moves. The UI
needs one, so the schema gains a ninth path.

```
products/<slug>/queue/YYYY-MM-DD.json
```

The `daily-moves` skill writes it. The app reads it and updates move state in
place. Shape is in `lib/repo/schema.ts` and mirrored here.

```jsonc
{
  "date": "2026-09-11",
  "product": "deckle",
  "generated_at": "2026-09-11T11:02:19Z",
  "excluded": [
    { "channel": "stackoverflow", "gate": "blocked",
      "reason": "product links in answers violate site policy" }
  ],
  "short": { "asked": 5, "returned": 3,
             "reason": "two more would have required a blocked channel" },
  "moves": [
    {
      "id": "dk-0141",
      "type": "helpful_reply",
      "channel": "r/node",
      "gate": "open",
      "target": { "title": "Puppeteer times out on Lambda", "url": "https://..." },
      "draft": "The timeout is almost never the render...",
      "why_today": "Third time this month someone hit the cold start",
      "expected": { "metric": "replies", "value": 4 },
      "proof_refs": [{ "claim": "cold start 190ms", "cited": false }],
      "state": "queued"
    }
  ]
}
```

Two rules on this file. The app may move a move between states and may edit a
draft. The app may never add a move, and may never change `excluded`.
Generation stays with the skill.

---

## Build order

Phases ship in this order because each one is useless without the one before it.

### Phase A. Foundation and the gate

The gate is the first thing built, before any screen, because every screen
depends on it and because it is the part that must never be wrong.

| Item | Detail |
|---|---|
| Project scaffold | Next.js 15, TypeScript strict, Tailwind v4 |
| Tokens | `app/globals.css`, every value from `design/TOKENS.md`, both themes |
| Repo layer | `lib/repo/` reads products, channels, metrics, queues, frontmatter |
| Schemas | `lib/repo/schema.ts`, zod for every file shape |
| **The gate** | `lib/gate.ts`, pure functions, no IO, fully unit tested |
| Voice lint | `lib/voice.ts`, em dashes, colons, semicolons, 68 banned words |
| Shell | Left rail, product switcher, nav, streak strip, right inspector |
| Tests | Gate and voice lint at 100% branch coverage. Nothing else yet |

**Acceptance.** A test proves that a channel whose gate is `blocked` cannot
produce a draft through any code path in the application, and that the test
fails if the gate is removed.

### Phase B. The working loop

The screens from `Growth Desk Working Loop.dc.html`. This is the product.

| Item | Detail |
|---|---|
| Today | Move queue, ranked, gate notice above the fold |
| Move card | The only elevated object in the app |
| Draft editor | Editable, mono, on sunk surface |
| Live voice lint | Inline hits with a one-tap fix |
| Proof chips | Cited and uncited states, uncited in the restricted color |
| Copy flow | Copy draft, state moves to `copied`, button confirms |
| Blocked state | Echoself with three moves and the short-run notice |
| Refusal screen | The r/AgingParents panel at 720x560 |

**Acceptance.** There is no Post button and no Schedule button anywhere in the
built application. A test greps the compiled output for those strings and fails
if either appears.

### Phase C. Measurement

| Item | Detail |
|---|---|
| Metrics | Four tiles, four only, per-product table, one chart |
| Definitions | In the inspector, from `metrics/definitions.md` |
| Streak | Fourteen-day grid, three rows, kill criterion state |
| Weekly review | Reading screen, leads with the worst number |

**Acceptance.** A test asserts the metrics page renders exactly four tiles and
that the strings `views`, `impressions` and `reach` appear nowhere in it.

### Phase D. Configuration

| Item | Detail |
|---|---|
| Channels | Hairline rows, gate badge carries the scan, expandable |
| Product folder | Eight files, verified and assumed chips, proof gaps |
| Assumption backlog | Across all products, ordered by cost to test |

### Phase E. Audit

| Item | Detail |
|---|---|
| Audit result | Seven rubric meters, total, prioritized diff |
| Held diffs | An item blocked on missing proof renders as held, not hidden |
| Pull request | Summary, hunks, Review on GitHub. Never Merge |

### Phase F. Generation

The button that closes the loop. `Run daily-moves` shells out to Claude Code
headless, which runs the existing skill and writes the queue file. The app
then reads it. No Anthropic API key lives in the app, and generation stays in
the skill where the rules already are.

---

## What must be true at every phase

1. No Post button. No Schedule button. No auto-send code path.
2. The gate runs server-side before any draft reaches a client component.
3. Page views are never computed, stored or displayed.
4. Every write goes to the same files the CLI and Claude Code read.
5. Both themes ship together. Neither is an afterthought.
6. The inspector is present on every screen that shows the shell.

---

## Test plan

The test suite is deliberately lopsided. The gate and the lint get near total
coverage. The UI gets smoke tests. That ratio matches where the risk actually is.

| Suite | Covers |
|---|---|
| `gate.test.ts` | Every gate state, every channel, the Echoself denylist including the substring matcher, and the negative case that a blocked channel yields no draft |
| `voice.test.ts` | Em dash, en dash, colon, semicolon, all 68 banned words, case insensitivity, and the fix suggestions |
| `schema.test.ts` | Every file in `products/` parses against its schema. Runs against the real repo, so a malformed file fails CI |
| `no-post-button.test.ts` | Greps the build output |
| `metrics.test.ts` | Four tiles, no view metrics, CSV round trip |

---

## Out of scope, permanently

Auto-posting. Hosting. Multi-user. Any platform write API. Selling this.
