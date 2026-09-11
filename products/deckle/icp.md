# Deckle ICP

Every claim carries a tag. `verified` means evidenced. `assumed` means it is a
hypothesis and belongs in the test backlog. `dead` means tested and failed.

## Who buys

- [verified] Software developers and technical teams building applications
  that need PDF generation without running the infrastructure themselves.
- [assumed] Backend or full-stack engineer at a company of 2 to 200 people.
- [assumed] They already have a working PDF path. It is Puppeteer or
  wkhtmltopdf, and it is fragile.
- [assumed] They have authority to swipe a card for $29 a month with no
  procurement process.

## The trigger event that makes them buy today

- [assumed] A font rendered wrong in production and nobody can reproduce it locally.
- [assumed] A Puppeteer job timed out on Lambda, or the Chromium layer blew
  past the deployment size limit.
- [assumed] They are building invoicing, reports or certificates this sprint
  and do not want to own a headless browser.
- [assumed] A page break landed in the middle of a table row and the customer noticed.

## What they call the problem, in their own words

Placeholders until `growth-research` replaces them with sourced quotes.

- [assumed] "puppeteer lambda timeout"
- [assumed] "wkhtmltopdf not rendering flexbox"
- [assumed] "chromium layer too big for lambda"
- [assumed] "how do I stop a table splitting across pages in a PDF"

## Where they already are

Technical search is the primary channel, not social. See `channels.yml`.

## The top objection

- [assumed] "Why would I pay for something Puppeteer does for free."
  The honest answer is the maintenance, the cold starts, the font handling and
  the deployment size, not the rendering itself.
- [assumed] "What happens to my documents." Answered by the self-hostable
  Docker option, which should be more prominent than it is.

## Who this is not for

- Teams generating fewer than a hundred PDFs a month. The free tier covers
  them forever and that is fine.
- Teams with a dedicated infra person who enjoys owning this.

## Why Deckle goes first in the focus rotation

- Fastest time to value of the three. Minutes, not weeks.
- Free tier means no price objection at the top of the funnel.
- Clear, high-intent search demand that programmatic pages can serve.
- Open channel gates almost everywhere, unlike Echoself.
