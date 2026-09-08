/**
 * ONE review dataset per location, generated deterministically from the
 * location profile, read by every Reviews screen. The Manager shows its
 * newest rows, the Tracker counts and charts the whole thing, the hub
 * cards, the plan and the AI summary compute their numbers from it. So a
 * sentence like "out of your last 10 reviews, 4 were 2 stars" is true of
 * the rows on the Manager page and of the bars on the Tracker (Ali,
 * 9 Sep: "these insights want to accurately reflect our underlying data").
 *
 * What the profile authors: source totals, the star mix, and the
 * `recent` block (last-N lows, month-on-month change, the spike and its
 * campaign, the theme). The generator builds the rows so those hold BY
 * CONSTRUCTION, and statsFor() reads everything else back off the rows.
 * Nothing on a screen is typed in twice.
 */

import { profileFor, type LocationProfile } from "@/lib/location-profiles";

export const TODAY = new Date(2026, 8, 9); // 9 Sep 2026, the prototype's "today"
const DAY = 86400000;
const SPAN_DAYS = 37 * 30; // the Tracker's 37-month window

export type Rating = 1 | 2 | 3 | 4 | 5 | "up" | "down";
export type Status = "needs" | "manual" | "auto" | "skipped";

export interface Review {
  id: string;
  source: string;
  name: string;
  rating: Rating;
  text: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  daysAgo: number;
  status: Status;
  aiDraft: string;
}

export interface ReviewStats {
  /** Newest rows the Manager shows. */
  inbox: number;
  needReply: number;
  replied: number;
  skipped: number;
  rating: string;
  ratingValue: number;
  total: number;
  fiveStar: number;
  sourceCount: number;
  /** Month to date against the previous full month. */
  thisMonth: number;
  lastMonth: number;
  monthChangePct: number;
  fourPlusPct: number;
  lastN: number;
  lowCount: number;
  lowStar: number;
  spike: LocationProfile["recent"]["spike"];
  theme: LocationProfile["recent"]["theme"];
  /** The headline that CAN move: the recent window's rating. Time-based
   *  (last 30 days) when there are enough reviews in it, otherwise the
   *  last 20 reviews. The lifetime average barely moves (Ali, 9 Sep:
   *  "extremely hard to move ratings even 0.1"). */
  recent: { kind: "days" | "count"; size: number; count: number; rating: string; ratingValue: number };
  /** Days since the oldest review still waiting for a reply, or null. */
  oldestWaitingDays: number | null;
  /** Share of this month's reviews that came from Google. */
  googleShareThisMonth: number;
  /** Reviews that arrived on the spike day (and the day after). */
  spikeDayCount: number;
  /** The last six months, oldest first, for the drill-down charts. */
  months: { label: string; count: number; rating: string; fourPlusPct: number }[];
  /** Multi-location: the sibling branch customers compare this one to. */
  compare: null | { label: string; self: string; mentions: number; siblingRecentRating: string; siblingRating: string };
  running: number;
  scheduled: number;
  draft: number;
  campaignsAll: number;
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

const NAMES = ["Sophie", "Dan", "Charlotte", "Priya", "Megan", "Tom", "Rachel", "Josh", "Amira", "Ben", "Chloe", "Owen", "Hannah", "Liam", "Grace", "Sam", "Ella", "Kwame", "Isla", "Noah", "Freya", "Arjun", "Maya", "Jack", "Lucy", "Ravi", "Zoe", "Callum", "Nadia", "Harry"];

const HIGH = [
  "Brilliant from start to finish. The team were patient with us and nothing was too much trouble. We'll be back.",
  "Great value and plenty to enjoy. Everyone was friendly and it all ran smoothly.",
  "Booked for a birthday and they went out of their way to make it special. Spotlessly clean too.",
  "Third visit this year and it keeps getting better. Easily recommended.",
  "Easy to find, easy parking, lovely staff. Exactly what we hoped for.",
  "The best experience we've had locally. Attentive without being fussy.",
  "Stayed until closing. So welcoming, and nobody rushed us.",
  "Quick, friendly and well organised. You can tell the team care.",
  "Came on a recommendation and it lived up to it. Will be sending friends.",
  "Faultless. Booked online, arrived, everything ready. Simple as that.",
  "Warm welcome, good prices, and they remembered us from last time.",
  "Exactly what a local business should be. Proper attention to detail.",
  "Turned up late and they still fitted us in with a smile. Five stars for that alone.",
  "Clean, calm and well run. The little touches make the difference.",
  "Our go-to now. Consistent every single time.",
  "Helpful over the phone, even better in person. Thank you.",
  "Lovely atmosphere and a team that seems to enjoy being there.",
  "Good communication from booking to the day. No surprises.",
  "A cut above the places nearby. Worth the extra ten minutes' drive.",
  "Did what they said, when they said. Rare these days.",
  "The staff sorted a problem before we'd even noticed it. Impressive.",
  "Relaxed, unhurried and genuinely friendly. We'll be regulars.",
  "First time here and already planning the next visit.",
  "Every question answered patiently. Left feeling looked after.",
  "Big thumbs up from all of us. Well priced for what you get.",
  "Straightforward, honest and quick. Exactly as it should be.",
  "Superb service on a busy Saturday. Hats off to the team.",
  "Small thing, but they followed up the next day to check we were happy.",
];
const MID = [
  "Lovely in parts, but a few things weren't as described. Worth checking before you go.",
  "Good overall. A little slow at the busiest time, but the staff were kind about it.",
  "Decent, if a bit rushed. Would give it another go on a quieter day.",
  "Fine. Nothing wrong, nothing memorable either.",
  "Mixed. Great start, then we waited a while for someone to come back to us.",
  "Solid, but pricier than it used to be for the same thing.",
  "OK for a quick visit. Wouldn't plan a day around it.",
  "Nice people, slightly tired surroundings. Three stars feels fair.",
  "Middle of the road. Booking was easy but the visit itself was average.",
  "Happy enough, though the website promised a bit more than we got.",
];
const LOW = (theme?: string) => [
  `Disappointing this time. ${theme ? `The ${theme} let it down badly.` : "Not what we expected for the money."} Left feeling let down.`,
  `Really wanted to like it, but ${theme ? theme : "the whole visit"} spoiled the day. Nobody seemed to notice.`,
  `The welcome was fine. After that, ${theme ? theme : "everything else let it down"}. Won't be rushing back.`,
  `Not good. ${theme ? `We told staff about ${theme} and nothing changed.` : "We raised it with staff and nothing changed."}`,
  `Two visits, two let-downs. ${theme ? `Both times it was ${theme}.` : "Both times something was off."}`,
  `Poor value on the day. ${theme ? `${theme.charAt(0).toUpperCase()}${theme.slice(1)} again.` : "Felt like an afterthought."}`,
  `Felt ignored. ${theme ? `Add ${theme} and it adds up to a bad afternoon.` : "Had to ask twice for the basics."}`,
  `Used to be great. ${theme ? `Now it is ${theme}, and nobody apologises.` : "Something has changed and not for the better."}`,
  `Booked well ahead and it still went wrong. ${theme ? `${theme.charAt(0).toUpperCase()}${theme.slice(1)} was the low point.` : "Would not book again."}`,
  `One to avoid until they sort ${theme ? theme : "the basics"} out.`,
];
const COMPARE = (self: string, other: string) => [
  `I went to the ${self} branch and was shocked. It's nothing like the amazing ${other} branch. 1 star.`,
  `We love the ${other} one, so we tried ${self}. Same menu, completely different experience. Won't be back to this one.`,
];
// Short closers, added when a deck has to go round again, so a line that
// reappears in a long inbox still reads differently.
const CLOSERS = ["Thanks all.", "See you soon.", "Keep it up.", "Recommended.", "Will be back.", "Five stars from us.", "Cheers.", "Top marks.", "Lovely.", "Thank you again."];
const PRAISE = (theme?: string) =>
  theme
    ? [
        `What stood out was ${theme}. That alone makes it worth coming back for.`,
        `Can't fault it. Special mention for ${theme}.`,
        `If you read one thing: ${theme}. That is why we keep coming back.`,
        `Everything was good, and ${theme} was the best bit.`,
        `Honestly the ${theme} made our day.`,
        `Plenty of places do the basics. Not many manage ${theme}.`,
      ]
    : [];

const DRAFT = "Thank you {{firstname}}, that means a lot to everyone at {{businessname}}. I'll pass it on to the team.";
const DRAFT_LOW = "Thank you for telling us, {{firstname}}. That isn't the experience we want anyone to have at {{businessname}}, and I'd like to put it right. Could you reach me directly so I can hear what happened?";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dateFromDaysAgo = (n: number) => new Date(TODAY.getTime() - n * DAY);

function spikeDaysAgo(spike?: { date: string }): number | null {
  if (!spike) return null;
  const [d, mon] = spike.date.split(" ");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dt = new Date(TODAY.getFullYear(), months.indexOf(mon), Number(d));
  if (dt > TODAY) dt.setFullYear(dt.getFullYear() - 1);
  return Math.round((TODAY.getTime() - dt.getTime()) / DAY);
}

const cache = new Map<string, Review[]>();

/** Every review for a location, newest first. Deterministic per key. */
export function reviewsFor(location: string, persona?: { engagement?: string } | null): Review[] {
  const profile = profileFor(location, persona);
  const key = `${location}:${persona?.engagement === "new" ? "starter" : persona?.engagement === "empty" ? "empty" : "engaged"}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rand = mulberry32(hash(key));
  const r = profile.recent;
  const themeText = r.theme && !r.theme.good ? r.theme.text : undefined;
  const praise = r.theme?.good ? r.theme.text : undefined;

  // 1. Source and rating pools, exactly the profile's counts.
  const starPool: number[] = [];
  (Object.entries(profile.starMix) as [string, number][]).forEach(([b, n]) => {
    for (let i = 0; i < n; i += 1) starPool.push(Number(b));
  });
  for (let i = starPool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [starPool[i], starPool[j]] = [starPool[j], starPool[i]];
  }
  const rows: { source: string; rating: Rating }[] = [];
  let cursor = 0;
  for (const s of profile.sources) {
    if (s.stars) for (let i = 0; i < s.stars; i += 1) rows.push({ source: s.id, rating: starPool[cursor++] as Rating });
    else {
      for (let i = 0; i < (s.up ?? 0); i += 1) rows.push({ source: s.id, rating: "up" });
      for (let i = 0; i < (s.down ?? 0); i += 1) rows.push({ source: s.id, rating: "down" });
    }
  }
  for (let i = rows.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  const total = rows.length;

  // 2. Dates. The two most recent months are sized so month-to-date
  //    against last month equals monthChangePct; the rest spread over
  //    the 37-month window with growth toward the present.
  const daysThisMonth = TODAY.getDate();
  const lastMonthDays = new Date(TODAY.getFullYear(), TODAY.getMonth(), 0).getDate();
  const recentShare = Math.min(0.12, 40 / Math.max(total, 40));
  // A falling month still needs lastN rows this month, so size last
  // month up from that when the change is negative.
  const baseLast = Math.max(3, Math.round(total * recentShare));
  const lastMonth =
    r.monthChangePct < 0 ? Math.max(baseLast, Math.ceil((r.lastN * 100) / (100 + r.monthChangePct))) : baseLast;
  const thisMonth = Math.max(r.lastN, Math.round((lastMonth * (100 + r.monthChangePct)) / 100));
  const older = Math.max(0, total - thisMonth - lastMonth);
  const days: number[] = [];
  const spikeAt = spikeDaysAgo(r.spike);
  for (let i = 0; i < thisMonth; i += 1) {
    if (spikeAt !== null && spikeAt < daysThisMonth && i < Math.round(thisMonth * 0.35)) days.push(spikeAt + (rand() < 0.7 ? 0 : 1));
    else days.push(Math.floor(rand() * daysThisMonth));
  }
  for (let i = 0; i < lastMonth; i += 1) days.push(daysThisMonth + Math.floor(rand() * lastMonthDays));
  for (let i = 0; i < older; i += 1) days.push(daysThisMonth + lastMonthDays + Math.floor((SPAN_DAYS - daysThisMonth - lastMonthDays) * Math.pow(rand(), 1.3)));
  days.sort((a, b) => a - b);

  // 3. Attach dates newest first, then force the recent facts.
  const list: Review[] = rows.map((row, i) => ({
    id: `r${i}`,
    source: row.source,
    name: NAMES[Math.floor(rand() * NAMES.length)],
    rating: row.rating,
    text: "",
    date: iso(dateFromDaysAgo(days[i])),
    daysAgo: days[i],
    status: "needs",
    aiDraft: DRAFT,
  }));
  // Last N: exactly lowCount at lowStar or below, the rest four stars or
  // above where the source is starred. Stars are swapped with rows
  // further down so the profile's mix still holds overall.
  const isStar = (x: Review) => typeof x.rating === "number";
  const swapRating = (a: number, b: number) => {
    const t = list[a].rating;
    list[a].rating = list[b].rating;
    list[b].rating = t;
  };
  const findFrom = (start: number, pred: (x: Review) => boolean) => {
    for (let k = start; k < list.length; k += 1) if (pred(list[k])) return k;
    return -1;
  };
  let lows = 0;
  for (let i = 0; i < Math.min(r.lastN, list.length); i += 1) {
    const x = list[i];
    if (!isStar(x)) continue;
    const wantLow = lows < r.lowCount;
    if (wantLow && (x.rating as number) > r.lowStar) {
      const k = findFrom(r.lastN, (y) => isStar(y) && (y.rating as number) <= r.lowStar);
      if (k > 0) swapRating(i, k);
    } else if (!wantLow && (x.rating as number) < 4) {
      const k = findFrom(r.lastN, (y) => isStar(y) && (y.rating as number) >= 4);
      if (k > 0) swapRating(i, k);
    }
    if ((list[i].rating as number) <= r.lowStar) lows += 1;
  }
  // This month's four-plus share.
  const month = list.filter((x) => x.daysAgo < daysThisMonth && isStar(x));
  const wantFourPlus = Math.round((month.length * r.fourPlusPct) / 100);
  let have = month.filter((x) => (x.rating as number) >= 4).length;
  // Rows are newest first, so anything older than this month sits past
  // thisMonth's rows; swaps go there so the overall mix is unchanged.
  const olderStart = list.findIndex((y) => y.daysAgo >= daysThisMonth);
  for (const x of month) {
    if (have === wantFourPlus || olderStart < 0) break;
    const i = list.indexOf(x);
    if (i < r.lastN) continue; // the last-N facts win
    if (have < wantFourPlus && (x.rating as number) < 4) {
      const k = findFrom(olderStart, (y) => isStar(y) && (y.rating as number) >= 4);
      if (k > 0) { swapRating(i, k); have += 1; }
    } else if (have > wantFourPlus && (x.rating as number) >= 4) {
      const k = findFrom(olderStart, (y) => isStar(y) && (y.rating as number) < 4);
      if (k > 0) { swapRating(i, k); have -= 1; }
    }
  }

  // 4. Texts, drafts, statuses.
  const inbox = Math.min(profile.inboxRows, list.length);
  const h = profile.hub;
  const target = { needs: h.needReply, skipped: h.skipped, replied: Math.max(0, inbox - h.needReply - h.skipped) };
  let needs = 0, skipped = 0;
  // Texts come off shuffled decks, one per pool, so no line repeats until
  // its deck is exhausted (Ali, 9 Sep: "stop repeating that they are good
  // with children"). Praise lines are rationed to one in six high reviews.
  const closers = [...CLOSERS];
  const deck = (arr: string[]) => {
    const d = [...arr];
    for (let i = d.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    let k = 0;
    return () => {
      const pass = Math.floor(k / Math.max(1, d.length));
      const line = d[k++ % d.length];
      return pass === 0 || !line ? line : `${line} ${closers[(k + pass) % closers.length]}`;
    };
  };
  const decks = { high: deck(HIGH), mid: deck(MID), low: deck(LOW(themeText)), praise: deck(PRAISE(praise)) };
  let compares = 0;
  let highs = 0;
  list.forEach((x, i) => {
    const low = typeof x.rating === "number" ? x.rating <= 2 : x.rating === "down";
    const mid = typeof x.rating === "number" && x.rating === 3;
    if (low) x.text = decks.low();
    else if (mid) x.text = decks.mid();
    else {
      highs += 1;
      x.text = praise && highs % 6 === 0 ? decks.praise() : decks.high();
    }
    // The first two low reviews in the last N name the sibling branch.
    if (low && r.compare && i < r.lastN && compares < 2) {
      x.text = COMPARE(r.compare.self, r.compare.label)[compares];
      compares += 1;
    }
    x.aiDraft = low ? DRAFT_LOW : DRAFT;
    if (i >= inbox) { x.status = "manual"; return; }
    // Newest rows tend to be unanswered; auto replies only exist for
    // five-star Google (the auto-reply rule on Reply Templates).
    if (needs < target.needs && (i < target.needs * 0.6 || rand() < 0.5)) { x.status = "needs"; needs += 1; return; }
    if (skipped < target.skipped && rand() < 0.15) { x.status = "skipped"; skipped += 1; return; }
    x.status = x.source === "google" && x.rating === 5 ? "auto" : "manual";
  });
  // Top up needs/skipped from the back of the inbox if the random walk fell short.
  for (let i = inbox - 1; i >= 0 && needs < target.needs; i -= 1) if (list[i].status !== "needs" && list[i].status !== "skipped") { list[i].status = "needs"; needs += 1; }
  for (let i = inbox - 1; i >= 0 && skipped < target.skipped; i -= 1) if (list[i].status === "manual" || list[i].status === "auto") { list[i].status = "skipped"; skipped += 1; }

  cache.set(key, list);
  return list;
}

const num = (r: Rating) => (r === "up" ? 5 : r === "down" ? 1 : r);

/** Everything the hub, the plan and the summary say, read off the rows. */
export function statsFor(location: string, persona?: { engagement?: string } | null): ReviewStats {
  const profile = profileFor(location, persona);
  const list = reviewsFor(location, persona);
  const inbox = list.slice(0, Math.min(profile.inboxRows, list.length));
  // Star sources only, the way the Tracker's headline counts it: a
  // Facebook recommendation is not a star rating.
  const stars = list.filter((x) => typeof x.rating === "number").map((x) => x.rating as number);
  const avg = stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0;
  const daysThisMonth = TODAY.getDate();
  const lastMonthDays = new Date(TODAY.getFullYear(), TODAY.getMonth(), 0).getDate();
  const thisMonth = list.filter((x) => x.daysAgo < daysThisMonth);
  const lastMonth = list.filter((x) => x.daysAgo >= daysThisMonth && x.daysAgo < daysThisMonth + lastMonthDays);
  const fourPlus = thisMonth.filter((x) => num(x.rating) >= 4).length;
  const r = profile.recent;
  const lastN = list.slice(0, r.lastN);
  const starsOf = (xs: Review[]) => xs.filter((x) => typeof x.rating === "number").map((x) => x.rating as number);
  const avgOf = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const last30 = list.filter((x) => x.daysAgo < 30);
  const windowKind: "days" | "count" = last30.length >= 15 ? "days" : "count";
  const windowRows = windowKind === "days" ? last30 : list.slice(0, 20);
  const windowAvg = avgOf(starsOf(windowRows));
  let compare: ReviewStats["compare"] = null;
  if (r.compare) {
    const sib = reviewsFor(r.compare.to, persona);
    const sibLast30 = sib.filter((x) => x.daysAgo < 30);
    const sibWindow = sibLast30.length >= 15 ? sibLast30 : sib.slice(0, 20);
    compare = {
      label: r.compare.label,
      self: r.compare.self,
      mentions: lastN.filter((x) => x.text.includes(r.compare!.label)).length,
      siblingRecentRating: avgOf(starsOf(sibWindow)).toFixed(1),
      siblingRating: avgOf(starsOf(sib)).toFixed(1),
    };
  }
  const months: ReviewStats["months"] = [];
  for (let back = 5; back >= 0; back -= 1) {
    const start = new Date(TODAY.getFullYear(), TODAY.getMonth() - back, 1);
    const end = new Date(TODAY.getFullYear(), TODAY.getMonth() - back + 1, 1);
    const rows = list.filter((x) => {
      const d = new Date(TODAY.getTime() - x.daysAgo * DAY);
      return d >= start && d < end;
    });
    const st = starsOf(rows);
    months.push({
      label: start.toLocaleDateString("en-GB", { month: "short" }),
      count: rows.length,
      rating: st.length ? avgOf(st).toFixed(1) : "",
      fourPlusPct: rows.length ? Math.round((rows.filter((x) => num(x.rating) >= 4).length / rows.length) * 100) : 0,
    });
  }
  const waiting = inbox.filter((x) => x.status === "needs");
  const spikeAt = spikeDaysAgo(r.spike);
  return {
    oldestWaitingDays: waiting.length ? Math.max(...waiting.map((x) => x.daysAgo)) : null,
    googleShareThisMonth: thisMonth.length ? Math.round((thisMonth.filter((x) => x.source === "google").length / thisMonth.length) * 100) : 0,
    spikeDayCount: spikeAt === null ? 0 : list.filter((x) => x.daysAgo === spikeAt || x.daysAgo === spikeAt + 1).length,
    months,
    recent: { kind: windowKind, size: windowKind === "days" ? 30 : 20, count: windowRows.length, rating: windowAvg.toFixed(1), ratingValue: windowAvg },
    compare,
    inbox: inbox.length,
    needReply: inbox.filter((x) => x.status === "needs").length,
    replied: inbox.filter((x) => x.status === "manual" || x.status === "auto").length,
    skipped: inbox.filter((x) => x.status === "skipped").length,
    rating: avg.toFixed(1),
    ratingValue: avg,
    total: list.length,
    fiveStar: list.filter((x) => x.rating === 5).length,
    sourceCount: profile.sources.length,
    thisMonth: thisMonth.length,
    lastMonth: lastMonth.length,
    monthChangePct: lastMonth.length ? Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100) : 0,
    fourPlusPct: thisMonth.length ? Math.round((fourPlus / thisMonth.length) * 100) : 0,
    lastN: lastN.length,
    lowCount: lastN.filter((x) => typeof x.rating === "number" && x.rating <= r.lowStar).length,
    lowStar: r.lowStar,
    spike: r.spike,
    theme: r.theme,
    running: profile.hub.running,
    scheduled: profile.hub.scheduled,
    draft: profile.hub.draft,
    campaignsAll: profile.hub.campaignsAll,
  };
}

/** Manager row tuples, the shape its seed used. */
export function inboxRowsFor(location: string, persona?: { engagement?: string } | null): [string, string, Rating, string, string, Status, string][] {
  const profile = profileFor(location, persona);
  return reviewsFor(location, persona)
    .slice(0, profile.inboxRows)
    .map((x) => [x.source, x.name, x.rating, x.text, x.date, x.status, x.aiDraft]);
}
