---
name: growth-research
description: Find where a product's buyer already complains, and quote their exact words. Use when setting up a new product folder, when channels go stale or get burned, or when asked to find new communities or people for Marskel, Deckle or Echoself.
---

# growth-research

Find the rooms where the buyer already describes the problem in their own words.
Record those words verbatim. Never invent a number.

## Read first, in this order

1. `products/<slug>/ethics.md`
2. `products/<slug>/icp.md`
3. `products/<slug>/channels.yml` (to avoid re-suggesting what is already there)

## Procedure

1. Derive ten search phrases from the ICP's own vocabulary, not from marketing
   vocabulary. A backend engineer says "puppeteer lambda timeout", not
   "PDF generation infrastructure challenges".
2. Search for communities, threads, and named people where those phrases appear.
3. For each candidate, record subscriber count, the promotion rule in the
   community's own words, and a link to its rules page.
4. Quote at least three pain phrases verbatim per community. Verbatim means
   copied, not summarized. Include the thread URL for each quote.
5. Apply the ethics gate. A community on the `never_post` list is still
   recorded, marked `gate: never_post`, and kept for research value only.
   State out loud which ones you marked and why.
6. Rank by density of the buying trigger from `icp.md`, not by subscriber count.

## Output

Append to `products/<slug>/channels.yml` using the schema below.
Never overwrite an existing entry whose `status` is `burned`.

```yaml
  - id: r/SaaS
    kind: reddit
    gate: open
    subscribers: 380000
    rules_url: https://reddit.com/r/SaaS/about/rules
    promo_policy: "self-promo Saturdays only"
    account: marskel_fred
    karma_required: 100
    cadence_cap_per_week: 2
    pain_phrases:
      - text: "I can't afford a fractional CMO"
        source: https://reddit.com/r/SaaS/comments/...
    status: warming
    warmed_on: null
```

## Hard rules

- Ten communities maximum per run. Fred hand-verifies every one by opening it.
- Never invent a subscriber count or a rule. Leave the field blank and flag it.
- Never recommend a community whose rules you could not actually read.
- New entries always start at `status: warming`. Only Fred promotes to `active`.
- A pain phrase without a source URL does not get written.
