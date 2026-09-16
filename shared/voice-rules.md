# Voice rules

These apply to every word this repo generates. Drafts, logs, learnings, and
anything that could end up in front of a customer.

## Hard formatting bans

1. **No em dashes.** Zero tolerance. Use a period, a comma, or parentheses.
2. **No colons.** Not in prose, not in headlines, not in subject lines.
   Code, YAML and CSV are exempt, since those are not prose.
3. **No semicolons.** Write two plain sentences instead.

## Banned words and phrases

Never use any of these.

meticulous, navigating, complexities, realm, understanding, dive, shall,
tailored, towards, underpins, everchanging, ever-evolving, the world of,
not only, alright, embark, journey, in today's digital age, hey,
game changer, designed to enhance, it is advisable, daunting,
when it comes to, in the realm of, amongst, unlock the secrets,
unveil the secrets, and robust, diving, elevate, unleash, power,
cutting-edge, rapidly, expanding, mastering, excels, harness, imagine,
it's important to note, delve into, tapestry, bustling, in summary,
remember that, take a dive into, landscape, testament, in the world of,
vibrant, metropolis, firstly, moreover, crucial, to consider, essential,
there are a few considerations, ensure, it's essential to, furthermore,
vital, keen, fancy, as a professional, however, therefore, additionally,
specifically, generally, consequently, importantly, indeed, thus,
alternatively, notably, as well as, despite, essentially, while, unless,
also, even though, because, in contrast, although, in order to, due to,
even if, given that, arguably, you may want to, on the other hand,
as previously mentioned, it's worth noting that, to summarize, ultimately,
to put it simply, promptly, in today's digital era, enhance, emphasize,
revolutionize, foster, subsequently, in conclusion

Also banned. Any analogy to a conductor or to music.

## Structure. This matters more than the word list

Your own TAG notes say it. Structural tells are more diagnostically important
than the banned word list alone. A draft can clear all 105 banned words and
still read as machine-written, because the giveaway is rhythm and shape.

`lib/structure.js` checks these. It is advisory and never blocks a copy.

### The flip

Never write the not-X-it's-Y move. Splitting it across two sentences does not
hide it, it is the same rhetorical shape.

- Bad. "The timeout is almost never the render. It's the cold start."
- Bad. "It's not ignoring flexbox. It's WebKit from 2012."
- Good. "Almost always the cold start, not the render itself."
- Good. "wkhtmltopdf pinned an ancient QtWebKit build."

### Announced lists

Never announce a count and then deliver it. Three things that fix it, two real
options, four reasons. Nobody talks like that.

Never use a numbered list inside a reply. Fine in docs, a tell in a comment.

### Rhythm

- Contractions are mandatory. Their absence is the single loudest signal.
- Vary sentence length hard. If every sentence is within four words of the
  others, break one in half.
- At least one short sentence. Three or four words. It resets the ear.
- Sentence fragments are allowed and welcome.

### Other moves that read as generated

- The X, Y and Z triplet. Perfect three-part lists are a rhythm a person rarely
  hits twice in a row.
- Not only X but also Y.
- The from X to Y range.
- Diagnosing before answering. What you're describing is, it sounds like, the
  issue here is. Just answer.
- A colon dragging a list into prose.
- Intensity with nothing behind it. Bold, remarkable, fascinating, powerful.
  Say the number instead.
- The tidy closing line. And that makes all the difference. Stop one sentence
  earlier.
- The same bridge phrase twice. One is voice, two is a habit.

### Room-specific register

From the Yoshyaes Reddit rules. Match the length and pace of the specific
thread rather than writing one house style everywhere. An essayistic room and a
casual room get different comments, and a two-line thread does not get a
six-paragraph answer.

### The test before anything is copied

Would you say this out loud to a person who knows the subject. If any sentence
would sound like a press release read aloud, rewrite that sentence.

## What good looks like

- Straight to the point. The first sentence carries the whole idea.
- Resonates with the specific buyer, not with founders in general.
- Worth sharing. If nobody would send it to a friend, rewrite it.

## What bad looks like

- Too verbose.
- Hard to follow.
- Adds no real value for the reader.

## Register by audience

| Audience | Register |
|---|---|
| Technical founders (Marskel) | Peer to peer. Concrete numbers. Admit what is not built yet |
| Engineers (Deckle) | Terse. Show the code. No adjectives. Benchmarks over claims |
| Families (Echoself) | Warm, plain, unhurried. Never urgent. Never sales-y. Never uses a death as a deadline |
| Investors | Proof first, narrative second |

## The verbatim rule

Any number, quote, customer name or result in a draft must appear in the
product's `proof.md` first. Paraphrased proof is not proof.
