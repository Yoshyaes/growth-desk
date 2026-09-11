# Claude Design prompts for the Growth Desk UI

Five prompts. Each produces one canvas with two to four artboards.

## How to run these

1. Run **Prompt 0 first.** It establishes the visual identity and produces the
   shell every other screen sits inside. Everything after it inherits.
2. For prompts 1 through 4, paste the **Shared design brief** block first,
   then the prompt body. The brief is repeated so each canvas comes back
   consistent rather than five different-looking apps.
3. Run them in order. Prompt 1 is the one that matters most. If only one gets
   built, build that one.

## What is being designed

Growth Desk is currently a CLI and a folder of markdown. This is the visual
version. The design thesis is that **the constraints are always on screen**.
In a normal marketing dashboard the rules live in a settings page nobody opens.
Here the ethics gate, the voice rules, the cadence caps and the proof citations
sit in a permanent right-hand inspector, because they are the product.

The second thesis is that there is **no Post button anywhere in this app.**
Every send affordance is a Copy button. That is a design requirement, not an
oversight, and any screen that grows a Post button has failed the brief.

---

## Shared design brief

> Paste this block at the top of prompts 1 through 4.

```
DESIGN SYSTEM. Use these exact values. Do not substitute.

Palette, light
  ground        #ECEEF0
  surface       #F8F9FA
  surface-sunk  #E2E5E8
  ink           #15181B
  ink-muted     #545C63
  ink-faint     #7C858C
  rule          #CFD4D8
  accent        #33406B      (deep slate indigo, used sparingly)
  accent-soft   #DCE0EC

Palette, dark
  ground        #111417
  surface       #191D21
  surface-sunk  #0C0E10
  ink           #E7EAEC
  ink-muted     #9BA3A9
  ink-faint     #7A828A
  rule          #2B3136
  accent        #8B9AD1
  accent-soft   #1D2334

Gate semantics. These three colors carry information, never decoration.
They are separate from the accent and must never be used for anything
except gate state.
  open          #3F6B4A  on  #DEE8E0   (dark #86B392 on #1B2620)
  restricted    #8A6A16  on  #EFE6CC   (dark #D4B266 on #2C2512)
  blocked       #9B3B2C  on  #F1DED9   (dark #DB8E7E on #2E1C18)

Typography
  UI, headings, labels   Familjen Grotesque  (fallback Helvetica Neue, Arial)
  Drafts, ids, numbers   JetBrains Mono      (fallback ui-monospace, Menlo)
  No third face.

  Draft copy renders in JetBrains Mono on purpose. It signals raw text the
  user is about to copy into someone else's textarea, not designed content.
  Numbers use tabular figures wherever they sit in a column.
  Uppercase labels get 0.12em letter spacing at 11px, 700 weight.

Layout shell
  Left rail, 220px fixed. The three products, always visible. marskel,
  deckle, echoself. One is in focus, the other two are dimmed but reachable.
  Below them, the nav. Today, Metrics, Channels, Product, Audit.
  Below that, pinned to the bottom, the streak strip.

  Main column, fluid, max 780px of content.

  Right inspector, 320px fixed. Always present. Never collapsible. It shows
  the rules in force for whatever is selected in the main column.

Component rules
  Do not put a border, a fill, a radius and a shadow on everything. Spend
  them by role. The move cards in the queue are the only elevated objects
  on any screen. Everything else sits flat on the surface.
  Radius is 4px everywhere it appears. Never larger.
  No gradients anywhere.
  No emoji as icons or section markers.

Both themes. Define the complete light palette on :root, redefine only the
tokens for dark. Give both equal care.

Do not use a purple-to-blue gradient hero, warm cream with a serif display,
Inter or Space Grotesk, centered everything, or rounded-lg on every block.
```

---

## Prompt 0. The shell and the design system

```
Design the application shell for Growth Desk, an operator console for a solo
founder running organic growth on three products at once. Produce one canvas
with three artboards at 1440x900.

Growth Desk drafts social posts and replies. It never sends them. The person
using it reads a draft, edits it, copies it, and pastes it into Reddit or
LinkedIn themselves. The app knows this and is built around it.

ARTBOARD 1. The shell, empty state, light theme.
ARTBOARD 2. The same shell, dark theme.
ARTBOARD 3. A component inventory sheet. Every reusable piece drawn once at
rest and once in its active or hover state, labeled. Gate badge in all three
states, status pill in all four states, move card, metric tile, streak cell,
inspector row, button primary, button ghost, the copy button.

DESIGN SYSTEM. Use these exact values. Do not substitute.

Palette, light
  ground #ECEEF0, surface #F8F9FA, surface-sunk #E2E5E8, ink #15181B,
  ink-muted #545C63, ink-faint #7C858C, rule #CFD4D8,
  accent #33406B, accent-soft #DCE0EC

Palette, dark
  ground #111417, surface #191D21, surface-sunk #0C0E10, ink #E7EAEC,
  ink-muted #9BA3A9, ink-faint #7A828A, rule #2B3136,
  accent #8B9AD1, accent-soft #1D2334

Gate semantics, information only, never decoration, separate from the accent
  open #3F6B4A on #DEE8E0, dark #86B392 on #1B2620
  restricted #8A6A16 on #EFE6CC, dark #D4B266 on #2C2512
  blocked #9B3B2C on #F1DED9, dark #DB8E7E on #2E1C18

Typography
  Familjen Grotesque for UI, headings and labels.
  JetBrains Mono for drafts, move ids and all numbers.
  No third face. Tabular figures in every column of numbers.

SHELL STRUCTURE
  Left rail, 220px fixed.
    Wordmark at top, small, not a logo lockup. Just "growth desk" set in
    Familjen Grotesque, lowercase, 15px, letter-spaced.
    Product switcher. Three rows. marskel, deckle, echoself. The one in focus
    carries a 2px left bar in the accent and full-strength ink. The other two
    sit at ink-muted. Each row shows its slug in mono at 12px and, right
    aligned, the count of moves waiting today.
    Nav below. Today, Metrics, Channels, Product, Audit. Text only, no icons.
    Pinned to the bottom, the streak strip. Fourteen small cells in a row,
    one per day. Filled cells use the accent, missed weekdays use rule,
    weekends are a 1px dot. Label above reads WEEKDAYS SENT and the value
    reads "6 / 10" in mono.

  Main column, fluid, content max 780px, generous left padding from the rail.

  Right inspector, 320px fixed, always present, never collapsible.
    Header reads RULES IN FORCE.
    Below it, stacked rows of label and value. In the empty state show the
    global ones. "Never auto-post" with a blocked-colored dot. "90 / 10 ratio"
    with the current count. "No em dashes, no colons, no semicolons".
    "Page views not tracked".

EMPTY STATE COPY for artboard 1 and 2
  Headline "Nothing queued for deckle yet."
  Body "Run daily-moves to draft today's five. Nothing here posts by itself."
  One primary button, "Run daily-moves".

The empty state must still look like a working application, not a blank page.
The rail, the streak strip and the inspector are all populated.
```

---

## Prompt 1. The core loop. Today, the draft editor, and a blocked move

> This is the screen that matters. Build this one first.

```
[PASTE THE SHARED DESIGN BRIEF HERE]

Design the core working loop of Growth Desk. One canvas, four artboards at
1440x900, using the shell from the previous canvas.

ARTBOARD 1. TODAY, the move queue, product deckle, light theme.

Header of the main column reads "Today" with the date "Friday 11 September"
beneath it in ink-muted. To the right, a mono line reading "5 drafted, 0 sent".

Immediately under the header, before any move, a gate notice. This is the
most important element on the screen and it must not read as an error banner.
It is a quiet, factual strip with a left bar in the blocked color.

  ETHICS GATE
  2 channels excluded from today's run.
  stackoverflow, product links in answers violate site policy
  github issues on competitor repos, not our room

Then five move cards, ranked, the only elevated objects on the screen.
Each card carries, in this order.
  A top strip with the move id in mono, the move type as a small uppercase
  label, an arrow, then the channel, then the gate badge for that channel.
  The thread title or person, as a link.
  Three to four lines of the draft, in JetBrains Mono at 13px, clipped with
  a soft fade, not an ellipsis.
  A footer row with "Expected 4 replies" in mono at ink-muted on the left,
  and on the right two controls. A ghost "Open" and a primary "Copy draft".

  There is no Post button. There is no Schedule button. Do not add one.

Use this real content for the five cards.

  1  dk-0141  helpful_reply  ->  r/node  [open]
     "Puppeteer times out on Lambda generating invoices"
     Draft opens with "The timeout is almost never the render. It's the
     cold start plus the Chromium layer. Check your deploy size first."

  2  dk-0142  asset  ->  docs-owned  [open]
     "Write the page. Stop a table splitting across pages"
     Draft opens with "Nobody has written this clearly. Four people asked
     it this month and every answer is a Stack Overflow fragment."

  3  dk-0143  helpful_reply  ->  r/webdev  [open]
     "wkhtmltopdf ignoring flexbox, any fix"
     Draft opens with "It's not ignoring flexbox, it's WebKit from 2012.
     There is no flag that fixes this."

  4  dk-0144  soft_reply  ->  r/django  [open]
     "How are people generating PDFs in production in 2026"
     Draft opens with "Three real options and the tradeoff is maintenance,
     not quality."

  5  dk-0145  direct_message  ->  linkedin  [restricted]
     "Maria Okafor, backend lead, posted about a PDF rendering bug Tuesday"
     Draft opens with "Saw your Tuesday post about the header repeating on
     page two."

The inspector on this artboard shows the rules for the selected card, card 1.
  RULES IN FORCE
  Channel  r/node
  Gate  open
  Cadence  1 of 2 this week
  Karma required  50
  Account  warming, 4 days left
  Ratio  0 promotional in last 10
  Voice  no em dashes, no colons, no semicolons
  Proof  2 claims, both cited

ARTBOARD 2. THE DRAFT EDITOR, dark theme.

The move opened. Main column holds the full draft in an editable field, mono,
14px, comfortable line height, on surface-sunk so it reads as a text field
rather than designed content.

Above the field, the thread context. The original question quoted in a
bordered block at ink-muted, so the person can see what they are answering.

Below the field, a live voice lint strip. Three items, each with a small
state dot.
  "No em dashes" passing
  "No colons" one hit, with the offending fragment shown inline in mono and
  the character marked, plus a one-tap fix
  "Banned words" passing, 0 of 105

Below the lint, a proof row. Two chips, each showing a claim from the draft
with a link back to proof.md. One chip is in the restricted color and reads
"unverified claim, no source" so the failure state is visible in the design.

Bottom bar of the main column has, left to right, character count in mono,
then a ghost "Skip today", then the primary "Copy draft".

The inspector on this artboard shows the channel's actual rules text,
scrollable, quoted from the subreddit, with the rules URL at the bottom.

ARTBOARD 3. THE BLOCKED STATE, product echoself, light theme.

This is the screen that justifies the whole product. Show Today for echoself
where the gate has removed most of what a normal tool would suggest.

The gate notice at the top is larger here and carries the blocked color.

  ETHICS GATE
  9 communities permanently excluded for echoself.
  r/GriefSupport, r/hospice, r/CaregiverSupport, r/AgingParents, r/cancer,
  r/dementia, r/widowers, r/palliativecare, r/TerminalIllness
  Plus any group matching grief, hospice, palliative, terminal, caregiver,
  bereave, widow, end of life, dying, funeral, memorial.
  These are research only. No promotional copy is generated for them.

Then only three move cards, not five, because that is what passed.

  1  es-0009  partnership  ->  partnerships-estate-law  [open]
  2  es-0010  asset  ->  search-intent  [open]
     "100 questions to ask a parent. Build the free list."
  3  es-0011  helpful_reply  ->  r/genealogy  [restricted]

Below the third card, a plain line in ink-muted, not a card.
  "Three moves today, not five. Two more would have required a channel the
  gate blocks. Nothing was padded."

The inspector here shows the echoself standing rules.
  Never use a death or a diagnosis as a deadline.
  Never target by grief signal.
  Lead with the recording habit, not the death.
  Never imply the Echo is the person.

ARTBOARD 4. THE REFUSAL, light theme, 720x560, a focused view.

The person has typed a request to draft something for r/AgingParents. Show
what the app says back. This is a single centered panel, calm, not alarming,
using the blocked color only as a 2px left bar and for one small label.

  Label  BLOCKED BY ETHICS GATE
  Headline  "r/AgingParents is permanently off limits."
  Body  "That room exists so people can say the worst thing they have ever
  had to say and be heard. This is checked into git so it cannot be edited
  away in a bad week."
  Then a secondary line  "Research there is fine. Selling there is not."
  Two buttons. Ghost "Read the gate". Primary "Show me what is open".

Do not make this screen apologetic or cute. It is a statement of position.
```

---

## Prompt 2. Measurement. Metrics, streak, weekly review

```
[PASTE THE SHARED DESIGN BRIEF HERE]

Design the measurement screens for Growth Desk. One canvas, three artboards
at 1440x900, using the established shell.

The whole system tracks four numbers and deliberately refuses to track page
views. That refusal should be visible in the design, stated once, plainly,
not hidden.

ARTBOARD 1. METRICS, all products, light theme.

Four metric tiles across the top, and only four. Replies, Qualified
conversations, Attributed signups, Paid. Each tile shows the 28-day number
large in JetBrains Mono, the 30-day target beneath it in ink-muted, and a
small sparkline. Tiles are flat on the surface with a hairline rule, not
elevated cards. The move cards in the queue are the only elevated objects
in this app.

Real numbers to use, 28 days.
  Replies 47, target 60
  Qualified conversations 9, target 12
  Attributed signups 11, target 15
  Paid 1, target 2

Below the tiles, a per-product table. Columns are product, replies, convos,
signups, paid, moves sent. Right aligned, tabular figures, hairline rules,
no zebra striping, no card around it.
  deckle    31   6   9   1   22
  marskel   14   3   2   0   11
  echoself   2   0   0   0    4

Under the table, one line in ink-faint at 12px.
  "Page views are not tracked here on purpose. They do not predict revenue
  at this stage."

Draw one chart. A 28-day stacked area of qualified conversations by product.
Give it a real scale, ticks that name values the chart actually reaches,
axis text in theme tokens so it reads in both themes, and an emphasized
endpoint. Do not draw a second chart. One is enough.

The inspector shows the four definitions, since the definitions are the
hard part.
  Reply  a human wrote back in the thread
  Qualified conversation  they stated the problem unprompted
  Attributed signup  source captured at signup and matched to a move id
  Paid  billing event, attributed by source

ARTBOARD 2. STREAK, dark theme.

The habit screen. The system's own diagnosis of whether it is working.

A large fourteen-day grid, one cell per day, weekends visually recessed.
Three rows, one per product, labeled in mono. Filled cells in the accent,
missed weekdays in rule, weekends as a 1px dot.

  deckle    9 of 10 weekdays
  marskel   5 of 10 weekdays
  echoself  2 of 10 weekdays

Beneath the grid, for echoself only, the kill criterion warning. Restricted
color, left bar, no icon, no exclamation mark.

  KILL CRITERION, DAY 22 OF 30
  "echoself is at 2 of 10 weekdays. Under 5 at day 30 means the habit did
  not take. Stop building features and make the call. This was written down
  in advance so it could not be quietly ignored."

Then a row of three small stat lines in mono.
  Longest run  7 days, deckle
  Median moves per active day  2.3
  Days since last echoself move  6

ARTBOARD 3. WEEKLY REVIEW, light theme.

A written brief, not a dashboard. This screen is mostly typography and it
should be the most comfortable reading experience in the app. Content column
at 680px, generous leading.

It leads with the worst number. That is a rule, not a layout preference.

  Eyebrow  WEEK OF 8 SEPTEMBER
  Headline  "echoself sent two moves in ten weekdays."

  Then sections with small uppercase labels and prose beneath.
  WORST NUMBER  one paragraph
  BEST MOVE OF THE WEEK  names dk-0141, says precisely why it worked, and
    links the rule it confirms
  CHANNEL TO BURN  names r/django, one line of reasoning
  ASSUMPTIONS NOW TESTABLE  three items, each a claim from icp.md tagged
    assumed, with the cheapest test written next to it
  ETHICS REVIEW  "One echoself move came within one revision of the line.
    es-0011 used the word irreplaceable. Rewritten before send."

  No charts on this artboard. No metric tiles. Words only.
```

---

## Prompt 3. Configuration. Channels and the product folder

```
[PASTE THE SHARED DESIGN BRIEF HERE]

Design the configuration screens for Growth Desk. One canvas, three artboards
at 1440x900, using the established shell.

These two screens are where the constraints live. They should feel like
reference material a person trusts, closer to a well-set document than to a
settings page.

ARTBOARD 1. CHANNELS, product deckle, light theme.

A list of channels, not a grid of cards. Each row carries, left to right.
  The channel id in mono at 14px
  A kind label, small uppercase, ink-faint. reddit, forum, qa, owned
  The gate badge, in its semantic color. open, restricted, blocked
  The status pill. active, warming, burned, research only
  A cadence meter. A small segmented bar showing used against cap, with
  the numbers in mono beside it. "1 / 2 this week"
  Karma required, mono, right aligned

Rows are separated by hairline rules, with no card, no fill, and no radius.
The gate badge is the only color on the row. Let it carry the whole scan.

Real rows to use.
  r/webdev        reddit  open        warming        0 / 2   100
  r/node          reddit  open        active         1 / 2    50
  r/django        reddit  open        active         1 / 1    50
  hackernews      forum   open        warming        0 / 1     0
  docs-owned      owned   open        active         3 / 10    0
  stackoverflow   qa      blocked     research only  0 / 0     0

Give the stackoverflow row a visibly different treatment. Its text sits at
ink-muted and the row is not interactive, since nothing can be drafted for it.
A small line beneath it, in the blocked color, at 12px.
  "Product links in answers violate site policy. Research only, permanently."

Expand one row, r/node, to show what sits underneath.
  The promo policy quoted from the subreddit's own rules
  Three pain phrases in mono, each with a source link
  Warmup state with a date and days remaining

The inspector shows a gate legend, since the three states are the whole
information architecture of this screen.
  open  promotional drafting allowed, subject to the ratio and the cap
  restricted  helpful replies only, no link, no product name
  blocked  no copy generated, ever, research only

ARTBOARD 2. PRODUCT, the folder view, product marskel, dark theme.

The eight files of a product folder, rendered as a working reference rather
than a file browser.

Left of the main column, a narrow file list. icp, voice, offers, proof,
channels, ethics, learnings, metrics. The selected one is proof.

Main area shows proof.md, rendered. Every claim carries a tag chip in mono
at 11px. verified claims use the open color. assumed claims use the
restricted color. Show both mixed together so the ratio is visible at a
glance, which is the point of the screen.

Real content.
  verified   Ten specialist agents. Aria, Marcus, Luna, Rex, Sage, Vera,
             Lex, Cleo, Nova, Atlas.
  verified   Pricing. Starter $79, Growth $319, Scale $799 per month.
  verified   Red / Yellow / Green graduated autonomy with Slack approvals.
  verified   Adam Wall, RevOps, Anthropic's first RevOps hire, reviews sales.
  verified   Jack Murrin, ex-Shyp Director of CX, reviews customer success.

Then a clearly separated block, using the blocked color for its left bar.
  DO NOT CITE
  Two expert profiles remain unverified.
  Finance has no verified expert. Never imply Finance has review coverage.

Then the gap, which is the most important thing on the screen and should be
the most prominent.
  PROOF GAP
  "No customer proof of any kind. No quotes, no numbers, no retention data.
  For a product sold on trust, this is the binding constraint. Closing it is
  worth more than any channel work."

ARTBOARD 3. THE ASSUMPTION BACKLOG, light theme.

A view that reads every icp.md across all three products and lists every
claim still tagged assumed, ordered by how cheap it is to test.

Each row has the claim in full, the product it belongs to, a cost estimate
in mono, and the specific test written as an action, not a category.

  deckle    "The trigger is a Puppeteer Lambda timeout"
            Test  search the last 90 days for that phrase, count instances
            Cost  20 minutes

  marskel   "The trigger is an unaffordable fractional exec quote"
            Test  direct message ten founders who posted about hiring one
            Cost  90 minutes

  echoself  "The milestone framing outperforms the health framing"
            Test  two versions of the 100-questions list, same traffic
            Cost  one afternoon, blocked on building the list

Show the blocked item differently. It cannot be tested until something else
ships, and the design should say so without a warning color.
```

---

## Prompt 4. The landing audit and the pull request

```
[PASTE THE SHARED DESIGN BRIEF HERE]

Design the landing audit flow for Growth Desk. One canvas, two artboards at
1440x900, using the established shell.

This is the feature no subscription tool has. It scores a landing page, then
it writes the fix and opens a pull request against the product's own repo.
The design should make that second half obvious, since it is the differentiator.

ARTBOARD 1. AUDIT RESULT, getdeckle.dev, light theme.

Top of the main column, the score. Seven rubric questions, each scored zero
to five. Show them as a compact horizontal list of seven segmented meters,
each labeled, with the total in JetBrains Mono at large size beside them.
Total reads "22 / 35".

The seven questions and their scores.
  1  Headline names the buyer's trigger event            2
  2  The real wedge is visible above the fold            3
  3  Proof is verbatim and attributed                    1
  4  Lowest-friction offer is most prominent             4
  5  Page answers the top objection in proof.md          3
  6  Copy obeys the voice rules                          5
  7  The buyer would recognize their own words           4

Order the meters so the reader sees the low scores first, or mark the two
lowest in the restricted color. The score comes before the diff, so a weak
page cannot be fixed cosmetically.

Below the score, the prioritized diff. Three items, highest revenue impact
first. Each item shows the exact current copy and the exact replacement,
side by side, with the removal in the blocked color at low saturation and the
addition in the open color at low saturation. Monospace for both.

  ITEM 1, question 3, proof
  current      "Faster setup and lower maintenance than Puppeteer"
  replacement  "Cold start 190ms against Puppeteer's 2.4s on Lambda,
                measured on the same 12-page invoice, 11 Sept 2026"
  note         "Blocked. This benchmark has not been run. See proof.md."

  ITEM 2, question 1, headline
  current      "HTML in. Pixel-perfect PDFs out."
  replacement  "Stop maintaining a headless Chrome in production."
  note         "The current headline describes the mechanism. The
                replacement names the trigger event."

  ITEM 3, question 5, objection
  current      nothing on the page
  replacement  a short section answering "why pay for what Puppeteer
                does free"

Give item 1 a visibly blocked state. It cannot ship because the proof does
not exist yet, and the design should show a diff that is held rather than
hiding it.

ARTBOARD 2. THE PULL REQUEST, dark theme.

The moment the app stops being a marketing tool. A pull request has been
opened against the deckle repo with the two shippable copy changes.

Show a compact pull request summary. Branch name in mono,
"growth-desk/audit-2026-09-11". Two files changed, a plus and minus count,
and the diff hunks rendered properly with line numbers.

Beneath it, a single line of status in the restricted color.
  "Opened, not merged. One item held. Item 1 needs a benchmark before it
  can ship."

And one primary button reading "Review on GitHub". Not "Merge". The app does
not merge, for the same reason it does not post.

Include a small footer strip across the bottom of this artboard.
  "Audit and fix in one session. This is the step a subscription tool
  cannot take."
```

---

## Notes on what to watch for in the output

- **A Post button.** If any artboard grows one, the model missed the brief.
  Send it back. Copy only.
- **A fifth metric.** Four numbers. If views, impressions or reach appear,
  reject the artboard.
- **The gate colors used decoratively.** Open green, restricted ochre and
  blocked brick carry meaning. They may not be used for a button, a heading
  or a hover state.
- **Cards everywhere.** Only the move cards in the queue are elevated.
  If the metrics table or the channel list comes back as a grid of rounded
  cards, the hierarchy is flat and the screen will not scan.
- **The inspector going missing.** It is the design thesis. It should be
  present on every artboard that shows the shell.
