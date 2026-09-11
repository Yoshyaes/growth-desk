---
name: daily-moves
description: Generate five drafted, ranked growth moves for one product for today. Use every weekday morning, or whenever Fred asks what he should do today for Marskel, Deckle or Echoself.
---

# daily-moves

The main loop. Produces five moves Fred could send in the next thirty minutes.

## Read first, in this order

1. `shared/voice-rules.md`
2. `products/<slug>/ethics.md` **before anything is generated**
3. `products/<slug>/icp.md`, `voice.md`, `offers.md`, `proof.md`
4. `products/<slug>/channels.yml`, filtered to `status: active`
5. `products/<slug>/logs/` last 14 days
6. `products/<slug>/learnings.md` and `shared/learnings.md`
7. `shared/move-types.md`

## Procedure

1. **Ethics gate first.** Build the allowed channel set from `ethics.md`.
   State out loud any high-value channel you excluded and the reason.
   Do not generate copy for a blocked channel even as an example.
2. **Cadence check.** Count moves per channel in the last 14 days of logs.
   Drop any channel already at its `cadence_cap_per_week`.
3. **Ratio check.** Count promotional moves in the last ten logged moves.
   If one or more, today's moves are all non-promotional.
4. Generate at most five moves, each typed from `shared/move-types.md`.
5. Draft the full copy for each. No placeholders. No "insert stat here".
   The draft must be paste-ready.
6. Rank by expected qualified conversations.
7. Assign each a move id per `shared/move-types.md`.

## Output format, per move

```
[mk-0143]  soft_reply  ->  r/SaaS  ->  thread: <url>

<the full draft, paste ready>

Why today: <one line>
Expected: <a number, so it can be scored later>
```

Close the run with the `gd log` command line Fred will paste after he sends.

## Hard rules

- **Never auto-post. Never call a write API. Output text only.**
- Every factual claim must trace to `proof.md`. Quote, do not paraphrase.
- Obey `shared/voice-rules.md` absolutely. No em dashes, no colons,
  no semicolons, no banned words. Check the draft against the list before output.
- If fewer than five ethical moves exist today, return fewer and say so.
  Never pad to hit the number.
- Never suggest a move in a channel whose `status` is `warming` or `burned`.
- For Echoself, re-read `ethics.md` a second time before output. Every move
  must pass the question "would I be comfortable if the whole community saw
  that this was drafted by a marketing system".
