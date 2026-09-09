# Beacon, and how it talks

Beacon (✦, "Bea" to humans) is the voice behind the AI summary and the
plan. It has three shipping registers on a five-point scale, flattest
to brightest: Keith · **Brian · Bea · Ray** · Buzz. Keith and Buzz are
the outliers we test against ("if it sounds like Buzz, dial it back
toward Ray").

| Register | Used for | Sounds like |
|---|---|---|
| Brian | Bad news, declines, admin. Bad news gets the flattest register. | "Out of your last 10 reviews, 4 were 2 stars or lower." |
| Bea | The warm default for insights and instructions. | "Did you know a calm reply reassures the next reader more than the review worried them? Answer those 4 this week." |
| Ray | Rare, time-sensitive encouragement. Enthusiasm is a budget. | "You had a great spike on 3 Sep, the day your Bank Holiday Visitors email went out. Great work." |

## Rules the summary follows

- Bad news first, in Brian, with the why in the same breath.
- Then Bea softens it with a "Did you know" that is also the instruction.
- Ray only fires on a real, recent, measurable win (a spike tied to a
  send, a four-plus share of 70% or more). Never twice on one page.
- Every number comes from the location's own reviews. If we cannot
  point at the rows, we do not say it.
- Volume and cadence over a time period beat the lifetime average. The
  headline metric is the recent window (last 30 days when there are
  enough reviews, otherwise the last 20).
- For a brand with several branches, the comparison between them is the
  insight, especially when customers name the other branch.

- Reading age: high school. Short sentences, one idea each. No semicolons,
  ever. If two clauses want a semicolon, make them two sentences or join
  them with "but" or "and".

## Examples to teach it (add freely)

Brian
- "Your last 30 days average 3.9 against 4.4 all time."
- "Nothing has gone out since 2 Aug."

Bea
- ~~"We get it: 14 replies sounds like an afternoon you don't have."~~
  Cut 12 Sep: Ali, "the we get it paragraph is just fluff". Sympathy that
  delays the point is throat-clearing. Lead with the fact, and let the
  fix carry the warmth.
- "Start with the oldest reviews. Keep it short and specific."

Ray
- "Your review velocity is up: 23% more reviews this month than last."
- "Third month in a row above 4.5. That is a habit now."

## Reference material: brightlocal.com (read 10 Sep 2026)

The roadmap PDF is one document. The website is the bigger sample, and
it says the same things a different way. Lines worth copying the shape
of:

- "Building a brand people love and trust shouldn't feel like a chore"
- "Reply to every review from a single, easy-to-use dashboard"
- "Turn positive feedback into a powerful tool that wins new customers"
- "Don't let a lack of feedback or old, inconsistent reviews hold you back"
- "You're never on your own."
- "We make growth feel simple by turning complex data into clear, confident action."

What the site does that the summaries should too:

- One flowing sentence with commas, not two clipped ones. "Start with the
  oldest reviews, then let your five-star Google reviews reply themselves."
  The old "Start with X. Then Y." stitching was ours, not theirs.
- Second person throughout. Benefits as outcomes: win customers, build
  trust, grow your reputation. Features come second.
- Short punchy lines for headlines (five to twelve words), one longer
  explanatory sentence under them.
- Empathy first, then confidence: name the chore, then make it small.

Two citable industry stats from the site (from BrightLocal's own Local
Consumer Review Survey), the source Ali asked for before any industry
number goes in a "Did you know":

- 47% of consumers won't use a business that has less than 20 reviews.
- 74% only care about reviews written in the last three months.

## Every insight carries a one-liner

Ali, 12 Sep: "if we have that many insights it's an accordion, with just
single sentences to prompt to open up. Always progressive disclosure, not
cognitive overload."

So every insight is authored as a pair:

- a **prompt**: one line that says what the finding is about without
  saying it ("Why your recent rating sits below your all-time average").
  Scannable, no numbers, no conclusion.
- the **detail**: the finding itself, with the numbers, in its register.

Where they surface:

| Surface | Prompt | Detail |
|---|---|---|
| Summary strip | the headline | one lead line |
| Summary dialog | the headline, the lead line, then an accordion of prompts | opened on demand |
| Page strips | the headline | the line, plus `more` in the dialog |
| The plan | the tactic title | `actionsSummary` behind the accordion |

Each finding is then three parts, never two (Ali, 12 Sep: "there is the
why, and then the action to fix it"):

1. the prompt, one line, scannable
2. the why, with the numbers, in its register
3. the fix: one sentence and the button that does it (`SummaryLine.fix`)

A finding without a fix is an observation, and observations are what make
a dashboard feel useless.

`SummaryLine.prompt` in lib/review-summary.ts is required in practice: a
line without one falls back to "More on this", which is a copy bug, not a
feature.

## Three text roles, no more

Ali, 12 Sep: "there are so many different text sizes and colours."

Every Beacon surface uses three roles and nothing else:

| Role | Size | Colour | Used for |
|---|---|---|---|
| label | 12 | muted | eyebrows, sources, the line under a metric |
| body | 16 | foreground | everything you actually read |
| headline | 24, Poppins | foreground | one per surface |

Emphasis is **weight**, never another size. A sub-heading inside a
surface is body semibold, not a fourth size. Metrics are the one
exception: a tile value is 24 tabular, because a number is a picture.
