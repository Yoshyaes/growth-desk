# growth-desk

A git-backed growth operating system for three products, built to replace a
$2,548 a year SaaS subscription with a folder of markdown files and five
Claude Code skills.

It drafts five ranked growth moves every weekday, applies a hard ethics gate
before a single word is generated, logs what happened to each one, and
compounds the results into a learnings library that no vendor can take away.

## Quick start

```bash
git clone https://github.com/Yoshyaes/growth-desk.git
cd growth-desk
export PATH="$PATH:$PWD/bin"
node scripts/seed.js     # stamp the example queues for today
node server/index.js     # http://127.0.0.1:4780
```

Dated files under `queue/` and `audits/` are generated and not committed.
The `example.json` beside them is the source. With no queue for today the app
shows its empty state, which is correct. A stale queue presented as today's
work would be a lie.

Then open Claude Code in this directory and run the `daily-moves` skill.

## The one rule that matters

Nothing in this repo posts anything. It drafts. A human presses send.
That single constraint removes the entire class of platform-ban risk that
shadowbans automated posters under Reddit's 2026 enforcement rules.

## The four metrics

Replies from real humans. Qualified conversations. Attributed signups. Paid.

Page views are deliberately absent. Adding a views column is a scope violation.

## Structure

```
CLAUDE.md                  operating rules, read every session
shared/                    voice rules, move taxonomy, cross-product learnings
docs/PRD.md                the full spec
bin/gd                     zero-dependency Node CLI
products/marskel/          AI executive team for solo founders
products/deckle/           HTML to PDF API for engineers
products/echoself/         voice legacy product, highest ethical care
.claude/skills/            the five skills
```

## Products

| Product | Buyer | Motion | Price |
|---|---|---|---|
| [Marskel](https://marskel.com) | Pre-seed technical solo founder | Sales-assisted, trust-gated | $79 / $319 / $799 per month |
| [Deckle](https://getdeckle.dev) | Backend engineer | Product-led, free tier | Free, then $29/mo |
| [Echoself](https://myechoself.com) | Adult child of an aging parent | Consumer, emotionally gated | $9/mo text, $19/mo voice |

## The kill criterion

If the streak is under 5 of 10 weekdays at day 30, the habit did not take.
Stop building features and make an honest call. This is written down here
so it cannot be quietly ignored later.

## The application

A local, file-backed UI over the same files. Zero dependencies, no build step.

```bash
node server/index.js       # http://127.0.0.1:4780
node --test 'tests/*.test.js'
```

It binds to localhost only. It has no database, because `products/` is the
database. It has no Post button, because it does not post.

| Path | Screen |
|---|---|
| `/<product>/today` | The move queue with the ethics gate above the fold |
| `/<product>/move/<id>` | The draft editor with the live voice lint |
| `/<product>/metrics` | The four numbers and the streak |
| `/<product>/channels` | The gate made visible |
| `/<product>/product/<file>` | Tagged claims and the proof gaps |
