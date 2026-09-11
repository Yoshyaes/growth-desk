# Move types

`daily-moves` may only emit moves of these seven types. The constraint exists
to stop the skill drifting into generic content-calendar output.

| Type | Definition | Expected reply rate | Typical product |
|---|---|---|---|
| `helpful_reply` | Answer a live question fully. No link. No product name | High | All three |
| `soft_reply` | Answer fully, then disclose the product in one clause at the end | Medium | Marskel, Deckle |
| `original_post` | A post that stands alone as useful, in an open-gate community | Medium | Deckle |
| `build_in_public` | A specific number, a shipped thing, or a failure, to an owned audience | Medium | Marskel |
| `direct_message` | One named human. One specific reason. No template | Highest | Marskel, Echoself partnerships |
| `asset` | Write or fix a page, doc, comparison, or free tool | Slow, compounding | Deckle, Marskel |
| `partnership` | Outreach to an organization rather than a person | Low volume, high value | Echoself |

## Ranking rule

Order by expected qualified conversations, not by reach.

A direct message to one hospice social worker outranks a post that four
thousand people scroll past. Reach is not a tiebreaker. When two moves have
the same expected conversations, the cheaper one in founder minutes wins.

## The 90/10 ratio

Across any rolling ten moves, at most one may be promotional.
`helpful_reply`, `asset` and `partnership` are non-promotional.
`soft_reply`, `original_post` and `build_in_public` count as promotional when
they name the product or carry a link.

## Move id format

`<product initials>-<4 digits>`, incrementing. Examples. `mk-0142`, `dk-0037`, `es-0009`.
