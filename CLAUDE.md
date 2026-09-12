# Growth Desk

Internal growth operating system for Marskel, Deckle and Echoself.
Read this file at the start of every session before running any skill.

## What this repo is

A git-backed growth desk. One folder per product. Five skills. One CLI.
It drafts growth moves. It never sends them.

## Absolute rules

1. **Never auto-post.** Draft only. A human presses send every time.
   No write calls to any platform API, ever. No scheduling into a posting tool.
2. **Read `products/<slug>/ethics.md` before generating anything.**
   The denylist is not advisory. It is checked in on purpose so it cannot be
   edited away in the moment.
3. **Every factual claim traces to `proof.md`.** No invented metrics.
   No rounded-up numbers. No "studies show". If it cannot be quoted, it is not proof.
4. **Obey `shared/voice-rules.md` absolutely.** No em dashes. No colons.
   No semicolons. The banned word list is enforced, not suggested.
5. **Never record page views.** The four metrics are replies,
   qualified conversations, attributed signups, paid.
6. **90/10.** Nine value moves for every one promotional move,
   measured on a rolling ten moves.
7. **Never pad.** Four good moves beats five mediocre ones.
   Say out loud when you came up short and why.
8. **Never delete a learning.** Retire it with a date under `## Retired`.

## Products

| Slug | What it is | URL | Care level |
|---|---|---|---|
| `marskel` | AI executive team for technical solo founders | marskel.com | Normal |
| `deckle` | HTML to PDF generation API for engineers | getdeckle.dev | Normal |
| `echoself` | Voice legacy product for families | myechoself.com | **Highest.** Read `products/echoself/ethics.md` twice |

## Skills

| Skill | When |
|---|---|
| `growth-research` | New product folder, stale channels, or hunting new communities |
| `daily-moves` | Every weekday morning. The main loop |
| `post-autopsy` | Right after Fred posts something |
| `landing-audit` | Before a launch, or when a page underperforms |
| `weekly-review` | Fridays |

The `landing-audit` skill writes `products/<slug>/audits/YYYY-MM-DD.json`.
Both applications read it. Neither writes it.

## Two runtimes, one repo

| | Local | Hosted |
|---|---|---|
| Entry | `node server/index.js` | `web/`, Next.js on Vercel |
| Storage | the working tree, read and write | config from the bundle, state through the GitHub API |
| Can it edit the ethics gate | yes | **no.** it needs a pull request |
| Phone | no | yes |

Both read the same files and run the same gate. `lib/` is shared and is plain
JavaScript on purpose, so `node --test` proves the gate with no build step.

See `docs/ARCHITECTURE-HOSTED.md`.

## Commands

```
gd log <product> <move-id> --url <url> --replies N --convos N --signups N --paid N --type TYPE --channel CH
gd streak
gd metrics [product] [--days 28]
gd today <product>

node scripts/seed.js            stamp the example queues with today's date
node server/index.js            the local app on 127.0.0.1:4780
node --test 'tests/*.test.js'   77 tests, no install needed
```

## Focus rotation

One product in focus per week. The scheduled task runs one product per day,
not three. Three products at once produces zero progress on each.

## Where things live

```
CLAUDE.md              this file
shared/voice-rules.md  writing rules, banned words
shared/move-types.md   the only seven move types allowed
shared/learnings.md    patterns that held on two or more products
docs/PRD.md            the full spec this repo was built from
products/<slug>/       eight canonical files, see PRD section 7
bin/gd                 the CLI
```
