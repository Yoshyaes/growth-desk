---
name: post-autopsy
description: Record what happened to a posted move and update the learnings. Use after Fred posts something, or whenever he pastes a URL and a result.
---

# post-autopsy

Closes the loop. This is the step that makes the repo compound.

## Inputs

Move id, the live URL, the observed result, and the text Fred actually posted.

## Procedure

1. Append a row to `products/<slug>/metrics.csv`.
2. Append the outcome to `products/<slug>/logs/YYYY-MM-DD.md`, including the
   **delta between the draft and what Fred actually posted**.
3. Update `products/<slug>/learnings.md` only when the result confirms or
   kills an existing rule. A new rule needs two data points before it is written.
4. A rule with three consecutive failures moves to `## Retired` with the date
   and the three failures listed. Retired rules are never silently deleted.
5. Promote a pattern to `shared/learnings.md` only when it has held on two
   different products.
6. If Fred rewrote more than half the draft, append the corrected sentences to
   `products/<slug>/voice.md` and say that you did.

## Hard rules

- The draft-versus-posted delta is the highest value field in the system.
  Always capture it. Never skip it because the edit looked minor.
- Never record page views.
- Never write a learning from a single data point. Mark it `n=1, unconfirmed`.
- If a channel shows signs of suppression (a post with zero views after an
  hour, a reply invisible in logged-out view), set that channel's `status` to
  `burned` in `channels.yml` immediately and say so loudly.
