/**
 * The five Beacon voices applied to the same situations (Ali, 10 Sep:
 * "a docs page with the different voices applied to different summaries,
 * good and bad across all, could be quite funny"). Keith, Brian, Bea, Ray
 * and Buzz are the five-point calibration scale, flattest to brightest.
 * Only Brian, Bea and Ray ship. Keith and Buzz are the over-rotation
 * fixtures: if a line sounds like Keith, warm it up; if it sounds like
 * Buzz, dial it back toward Ray. Every number is one the product could
 * have produced from the rows, so the same line can be tested for real.
 */

export type Voice = "keith" | "brian" | "bea" | "ray" | "buzz";

export const VOICES: { id: Voice; name: string; role: string; ships: boolean }[] = [
  { id: "keith", name: "Keith", role: "Flattest. Deadpan to the point of bleak. The floor of the scale.", ships: false },
  { id: "brian", name: "Brian", role: "Flat and factual. The register for bad news and admin. Ships.", ships: true },
  { id: "bea", name: "Bea", role: "Warm, plain, second person. The default. Ships.", ships: true },
  { id: "ray", name: "Ray", role: "Bright. Rare. Reserved for a real, recent, measurable win. Ships.", ships: true },
  { id: "buzz", name: "Buzz", role: "Cheeky northern lad, over the top. The ceiling. Never ships.", ships: false },
];

export interface Situation {
  id: string;
  title: string;
  facts: string;
  kind: "bad" | "good" | "neutral";
  /** Two beats, the way every AI line is displayed: a lede, then the
   *  supporting sentence(s). */
  lines: Record<Voice, { lede: string; detail: string }>;
}

export const SITUATIONS: Situation[] = [
  {
    id: "bad-month",
    title: "A bad month",
    facts: "Last 30 days average 3.9 against 4.4 all time. Three one-star reviews in the last ten, all naming the Hove branch.",
    kind: "bad",
    lines: {
      keith: { lede: "Your rating fell to 3.9.", detail: "Three one-star reviews. They mention Hove. That is the situation." },
      brian: { lede: "Your last 30 days average 3.9 against 4.4 all time.", detail: "Three of your last ten reviews are one star, and all three name your Hove branch. That is the number to watch." },
      bea: { lede: "Your last 30 days average 3.9 against 4.4 all time, and three of your last ten reviews are one star.", detail: "All three mention Hove, so that is where the fix is. Did you know two replies today would be the first thing the next customer sees?" },
      ray: { lede: "Rough month, but a fixable one.", detail: "Three one-star reviews all point at Hove, so you already know where to start. Answer those three today and the next ten reviews look very different." },
      buzz: { lede: "Right, hands up, it's been a shocker.", detail: "Three one-stars and every one of 'em's got it in for Hove. Get down there, sort it, reply to the lot, and we'll say no more about it." },
    },
  },
  {
    id: "good-month",
    title: "A great month",
    facts: "Review velocity up 30% on last month. The Bank Holiday Visitors email put 7 reviews in on 3 September. Third month in a row above 4.5.",
    kind: "good",
    lines: {
      keith: { lede: "Reviews are up 30%.", detail: "The email on 3 September produced seven. The rating is above 4.5 again." },
      brian: { lede: "Review velocity is up 30% on last month.", detail: "Your Bank Holiday Visitors email is why 3 September spiked, with seven reviews in a day. Third month in a row above 4.5." },
      bea: { lede: "Review velocity is up 30% on last month, and your Bank Holiday Visitors email is why 3 September spiked.", detail: "That is three months in a row above 4.5, which is a habit now." },
      ray: { lede: "Great work.", detail: "Your Bank Holiday email brought in seven reviews in one day, velocity is up 30%, and that is three months in a row above 4.5. Send the next one while they are still smiling." },
      buzz: { lede: "Get in!", detail: "Seven reviews off one email, up thirty percent, and three months on the bounce over 4.5. You're on fire, pal. Send another one before the kettle's boiled." },
    },
  },
  {
    id: "backlog",
    title: "A reply backlog",
    facts: "26 reviews waiting for a reply. The oldest has waited 7 days. 19 of them are five-star Google reviews.",
    kind: "neutral",
    lines: {
      keith: { lede: "26 reviews are unanswered.", detail: "The oldest is a week old. Nineteen are five stars." },
      brian: { lede: "26 of your 60 reviews are still waiting for a reply.", detail: "The oldest has waited 7 days. Nineteen of the 26 are five-star Google reviews." },
      bea: { lede: "We get it: 26 replies sounds like an afternoon you don't have.", detail: "Start with the oldest, then let your five-star Google reviews reply themselves. That takes 19 off the pile in a minute." },
      ray: { lede: "Good news hiding in that pile: 19 of the 26 waiting are five stars.", detail: "One auto-reply rule answers all of them today, and you get the afternoon back." },
      buzz: { lede: "Twenty-six waiting?", detail: "Come on, they've been stood there a week. Nineteen are five-stars, so flick the auto-reply on, put your feet up, job's a good 'un." },
    },
  },
  {
    id: "quiet",
    title: "Nothing happening",
    facts: "No campaign has gone out since 2 August. Four reviews this month against nine last month.",
    kind: "bad",
    lines: {
      keith: { lede: "Nothing has been sent since 2 August.", detail: "Reviews have halved." },
      brian: { lede: "Nothing has gone out since 2 August.", detail: "Four reviews this month against nine last month. A campaign is the one lever that changes this." },
      bea: { lede: "A quiet month.", detail: "Nothing has gone out since 2 August, and reviews have dropped from nine to four. Businesses that ask get several times more than businesses that wait, so ask." },
      ray: { lede: "Quiet month, easy fix.", detail: "One email to last month's happy customers and this chart starts moving again by Friday." },
      buzz: { lede: "Tumbleweed, mate.", detail: "Nowt sent since August and the reviews have gone quiet. Fire an email out, go on, it's one button." },
    },
  },
  {
    id: "velocity-up",
    title: "Velocity up after a campaign (the Tracker strip)",
    facts: "Review velocity up 30% on last month. The Bank Holiday Visitors email caused the spike on 3 September. The recent rating is holding level with all time.",
    kind: "good",
    lines: {
      keith: { lede: "Reviews are up 30% on last month.", detail: "The email caused it. The rating has not moved." },
      brian: { lede: "Review velocity is up 30% on last month.", detail: "Your Bank Holiday Visitors email is the reason. Your recent rating is holding, which is the number the next customer sees." },
      bea: { lede: "Review velocity is up 30% on last month, and your Bank Holiday Visitors email is why.", detail: "Asking works, so the next one should already be in the diary. Your recent rating is holding up too, and that is the number that matters to the next customer." },
      ray: { lede: "Up 30% on last month, and it was your Bank Holiday email that did it.", detail: "That is proof asking works. Book the next one now while the rating is holding, and watch this chart do it again." },
      buzz: { lede: "Thirty percent up on last month, pal, and it was that Bank Holiday email what did it.", detail: "Told you asking works. Get the next one sent before you've finished your brew, and your rating's holding lovely by the way." },
    },
  },
  {
    id: "trial-ending",
    title: "Three days left on the trial",
    facts: "Google connected. Four reviews found, three of them five stars. Nothing answered, nothing sent. Three free auto-replies unused.",
    kind: "neutral",
    lines: {
      keith: { lede: "The trial ends in three days.", detail: "Four reviews were found. None were answered." },
      brian: { lede: "Three days left on your free trial.", detail: "It has found your four Google reviews, three of them five stars. None have a reply yet, and three free auto-replies are unused." },
      bea: { lede: "Three days left, and your trial has already found four Google reviews, three of them five stars.", detail: "Nobody has had a reply yet. Try one of your three free auto-replies today and see what it does." },
      ray: { lede: "Three days left and you are off to a good start: four reviews found, three of them five stars.", detail: "Use a free auto-reply today and you will see why people keep this." },
      buzz: { lede: "Three days, pal, then it's gone.", detail: "Four reviews found, three belters. You've got three free auto-replies sat there doing nowt. Use 'em!" },
    },
  },
  {
    id: "trial-ended",
    title: "Trial ended nine days ago",
    facts: "Four new reviews have arrived since the trial ended. None of them have had a reply. Monitoring stopped the day the trial did.",
    kind: "bad",
    lines: {
      keith: { lede: "The trial ended nine days ago.", detail: "Four reviews arrived. Nobody replied. Nobody was watching." },
      brian: { lede: "Your free trial ended nine days ago.", detail: "Four new reviews have arrived since, and none of them have had a reply. Monitoring stopped the day the trial did." },
      bea: { lede: "Since your trial ended nine days ago, four new reviews have come in and nobody has seen them.", detail: "Pick up where you left off this week and the first month is half price." },
      ray: { lede: "Four new reviews have arrived while you were away, so people are still talking about you.", detail: "Come back this week, first month half price, and answer them today." },
      buzz: { lede: "Oi, you left!", detail: "Four reviews turned up while you were gone and nobody's said a word to 'em. Half price if you're back this week. Go on, don't be daft." },
    },
  },
];
