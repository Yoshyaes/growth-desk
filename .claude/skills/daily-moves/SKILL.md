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

## Write like a person, not like a tool

The banned word list was never the hard part. A draft can clear all 105 words
and still read as machine-written, because the giveaway is shape. Fred's own
TAG notes say structural tells matter more than the word list alone.

Before output, read the draft against `shared/voice-rules.md` section
"Structure. This matters more than the word list", and check these by hand.

- **No not-X-it's-Y.** Splitting it across two sentences does not hide it.
  Not "the timeout is never the render, it's the cold start".
  Write "almost always the cold start, not the render itself".
- **Never announce a count.** No "three things that fix it", no "two real
  options". Nobody talks that way.
- **No numbered list inside a reply.** Fine in a doc, a tell in a comment.
- **Contractions in every draft.** Their absence is the loudest single signal.
- **Vary sentence length hard, and include one short sentence.** Three or four
  words. It resets the ear. Fragments are welcome.
- **No X, Y and Z triplets.** Perfect three-part lists are a rhythm a person
  rarely hits twice running.
- **Do not diagnose before answering.** No "what you're describing is".
- **No tidy closing line.** Stop one sentence earlier than feels finished.
- **Match the room.** An essayistic thread and a casual one get different
  registers, and a two-line question does not get six paragraphs back.

The last test, before anything is output. Would Fred say this out loud to
someone who knows the subject. If a sentence would sound like a press release
read aloud, rewrite that sentence.

`lib/structure.js` checks most of this and the editor shows it as AI tells.
It is advisory. A clean lint is not the same as sounding human, so read the
draft yourself.

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
