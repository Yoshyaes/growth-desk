# Hosted Growth Desk. Architecture decision

**Date** 12 September 2026
**Decision** Ship a Next.js app on Vercel. The GitHub repository stays the database.
**Supersedes** the stack section of `docs/DEVELOPMENT-PLAN.md`, not its rules

---

## The problem hosting creates

Vercel's filesystem is read only at runtime. The local app writes markdown,
JSON and CSV into `products/`. On Vercel that write fails, so hosting appears
to force a database, and a database appears to end the file-backed model the
PRD argued for.

It does not. Look at the actual write volume.

| What changes during a day | Writes |
|---|---|
| Move state, queued to copied or skipped | around 10 |
| Draft edits, debounced | around 15 |
| Metric rows after posting | around 5 |
| **Total** | **roughly 30 a day** |

Thirty writes a day is not a database workload. It is a commit log. So the
repository stays the database and the GitHub Contents API is the driver.

---

## The shape

Two stores, split by whether the running application is allowed to change a
file. This is the design decision that carries the most weight.

| Store | Holds | Source | Writable at runtime |
|---|---|---|---|
| **Config** | `ethics.md`, `channels.yml`, `icp.md`, `voice.md`, `offers.md`, `proof.md`, `shared/voice-rules.md` | The deployment bundle | **No** |
| **State** | `queue/YYYY-MM-DD.json`, `metrics.csv`, `logs/*.md` | GitHub Contents API | Yes |

### Why this makes the ethics gate safer hosted than local

On the laptop, the gate is a file Fred can edit in a weak moment.

On Vercel the gate ships inside an immutable deployment bundle. The running
application has no write path to it. Changing the Echoself denylist now takes
a commit, a pull request and a redeploy. That is friction on exactly the
decision that should have friction, and it is enforced by the platform rather
than by discipline.

`lib/store/paths.js` holds the allowlist and the test suite proves it. A write
to `ethics.md` or `channels.yml` throws before any HTTP request is made.

---

## The write path

```
client edits a draft
  -> debounce 800ms
  -> server action
  -> gate check on the move's channel          (refuse if blocked)
  -> voice lint, advisory, never blocking
  -> PUT /repos/Yoshyaes/growth-desk/contents/products/<slug>/queue/<date>.json
     conditional on the blob sha we last read
  -> on 409, re-read once and retry, then surface the conflict
  -> invalidate the cache entry
```

Every write is a commit, so `git log` answers "who changed this draft and when"
with no audit table to build.

### Budget and limits

| Property | Number |
|---|---|
| Write latency, p50 | roughly 400ms |
| Reads, cached in process | 15 second TTL |
| GitHub API limit, authenticated | 5,000 an hour |
| Expected use | under 100 an hour |
| Headroom | about 50x |

Serverless memory is per instance, so the cache is a best-effort read
reducer, not a correctness mechanism. Correctness comes from the conditional
sha on every write.

### What happens when it conflicts

Two tabs, or the laptop CLI and the phone at once. The second write gets a
409, re-reads, retries, and if it conflicts again the user is told which move
changed underneath them. Nothing is clobbered silently. This is the same
guarantee git gives, because it is git.

---

## Auth

Single user. Auth.js with the GitHub provider, and an allowlist of exactly one
GitHub login. Everything under `/[product]` requires a session. No signup, no
password reset, no user table.

Two reasons for GitHub rather than email.

1. The app is already talking to GitHub. One identity, not two.
2. The token that writes commits is scoped to a repository Fred owns, so
   authorisation and identity are the same fact.

---

## Mobile is the point, not a breakpoint

Phone access is the reason to host. The morning queue is a morning habit and
mornings happen on a phone. The mockups are 1440 wide desktop screens, so the
layout needs a real second design, not a squeeze.

| Region | Desktop | Phone |
|---|---|---|
| Left rail | 220px, always visible | A product switcher in the top bar, nav as a bottom tab row |
| Main column | max 780px | Full width, 16px gutters |
| Right inspector | 320px, never collapsible | **A sheet that opens from the move card.** The rules stay one tap away, never hidden behind a settings screen |
| Move card | Draft clipped to 108px | Draft clipped to 4 lines, tap to open |
| Copy button | In the card footer | Sticky at the bottom of the draft view, thumb reachable |

The inspector rule survives the port. On desktop it is always on screen. On
phone it is one tap from any draft and it opens by default the first time a
restricted or blocked channel appears in a session.

---

## What carries over unchanged

This is why the local build was structured the way it was.

| Module | Change needed |
|---|---|
| `lib/gate.js` | none |
| `lib/voice.js` | none |
| `lib/yaml-lite.js` | none |
| `lib/store/*` | none, the github backend was written for this |
| `tests/*` | none, 64 tests move across |
| `lib/repo.js` | becomes async at the IO boundary |
| `server/pages/*` | replaced by React Server Components |
| `public/app.css` | becomes the token layer, plus the phone layout |

The pure logic is the part that must be right, and it does not get rewritten.

---

## Failure modes

| Failure | Behavior |
|---|---|
| GitHub API down | Reads serve from cache where present. Writes fail loudly with the draft preserved in the client. The draft is never silently lost |
| Rate limited | The error names the reset time. Reads keep working from cache |
| A write conflicts twice | The user is told which move changed and shown both versions. No auto-merge |
| Queue file missing for today | Empty state. **Never** show a stale queue as today's work |
| Token revoked | The app reads nothing and says so plainly. It does not fall back to a partial view |
| Vercel down | The local zero-dependency server still runs from the same repo. That is the offline path |

---

## Environment

```
GITHUB_REPO=Yoshyaes/growth-desk
GITHUB_TOKEN=<fine grained PAT, contents read and write, this repo only>
GITHUB_BRANCH=main
GD_STORE=github
AUTH_GITHUB_ID=<oauth app id>
AUTH_GITHUB_SECRET=<oauth app secret>
AUTH_SECRET=<openssl rand -base64 32>
GD_ALLOWED_LOGIN=Yoshyaes
```

The token is fine grained, scoped to this one repository, contents read and
write only. It cannot reach any other repo Fred owns.

---

## Cost

| Item | Cost |
|---|---|
| Vercel Hobby | $0 |
| GitHub API | $0 |
| Database | none |
| Domain, optional | around $12 a year |
| **Total** | **$0** |

Still nothing against HeyCatch's $2,548.

---

## What this does not change

Every rule in `CLAUDE.md` survives the port, and two of them get stronger.

1. **No Post button.** No send affordance in any rendered page. The test that
   greps every route moves across.
2. **The gate runs server-side.** On Vercel it runs in a server component or a
   server action, so a blocked draft never crosses the network to a browser.
3. **Page views are never tracked.**
4. **The gate config is not writable by the application.** Newly enforced by
   the platform rather than by discipline.
5. **The files stay the source of truth.** Claude Code, the `gd` CLI and the
   skills all keep working against the same repository.
