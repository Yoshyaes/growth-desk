---
name: landing-audit
description: Audit a landing page against the ICP and then implement the fixes. Use before a launch, when a page is underperforming, or when Fred asks for a teardown of marskel.com, getdeckle.dev or myechoself.com.
---

# landing-audit

The part a subscription tool cannot do. Audit, then actually ship the fix.

## Procedure

1. Fetch the page. Read `products/<slug>/icp.md`, `proof.md`, `offers.md`.
2. Score against this rubric, zero to five each. Show the scores.

   | # | Question |
   |---|---|
   | 1 | Does the headline name the buyer's trigger event from `icp.md` |
   | 2 | Is the real wedge visible above the fold |
   | 3 | Is proof verbatim and attributed to a named source |
   | 4 | Is the lowest-friction offer the most prominent one |
   | 5 | Does the page answer the top objection in `proof.md` |
   | 6 | Does the copy obey `shared/voice-rules.md` |
   | 7 | Would the buyer recognize their own words anywhere on the page |

3. Return a prioritized diff. Highest revenue impact first. Each item names
   the exact current copy and the exact replacement.
4. Then implement the copy changes in the product's own repo and open a pull
   request. Do not merge. One pull request per audit.

## Hard rules

- Never change pricing, legal text, or any claim without explicit approval in
  the same session.
- Never invent proof to fill a weak section. Flag the gap and say what evidence
  would close it.
- Keep the pull request reviewable. If the diff exceeds roughly 200 lines,
  split it and ship the highest-impact half first.
- Report the score before the diff, so a weak page cannot be fixed cosmetically.
