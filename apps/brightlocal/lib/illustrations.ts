/**
 * The DS illustration suite with a meaning for each, so a surface (or
 * Beacon) can pick one by what it is saying rather than by name (Ali,
 * 10 Sep: "AI could suggest an appropriate illustration, so you'd have
 * to derive a meaning from each, or have a list"). `pickIllustration`
 * scores the catalogue against a few keywords and returns the best fit.
 * Rule from Ali: black line work with one green accent, which is what
 * the suite already is.
 */

import * as Art from "@brightlocal/illustrations";

export interface IllustrationMeaning {
  name: keyof typeof Art;
  meaning: string;
  keywords: string[];
}

export const ILLUSTRATIONS: IllustrationMeaning[] = [
  { name: "SpeechBubbleReviewsStarsComment", meaning: "A review: stars in a speech bubble", keywords: ["review", "reviews", "rating", "stars", "feedback"] },
  { name: "HandStarReview", meaning: "Giving a star, being rated", keywords: ["rating", "star", "five-star", "praise"] },
  { name: "HeadSpeechBubbleChat", meaning: "Someone talking, a reply, a conversation", keywords: ["reply", "replies", "respond", "answer", "conversation"] },
  { name: "SpeechBubbleChatMessage", meaning: "A message, a reply", keywords: ["reply", "message", "response"] },
  { name: "EnvelopeMessage", meaning: "An email or request going out", keywords: ["email", "campaign", "request", "send", "ask"] },
  { name: "SendPaperAirplane", meaning: "Sending, launching a campaign", keywords: ["send", "campaign", "launch", "sms"] },
  { name: "MegaphoneAnnouncementNews", meaning: "Announcing, promoting, being heard", keywords: ["announce", "promote", "showcase", "marketing"] },
  { name: "CalendarSchedule", meaning: "A date, a deadline, time passing", keywords: ["days", "months", "deadline", "trial", "schedule", "recent"] },
  { name: "ClockTimeAlarm", meaning: "Waiting, overdue, urgency", keywords: ["waiting", "overdue", "oldest", "late", "urgent"] },
  { name: "ClockTimeSave", meaning: "Saving time, automation", keywords: ["auto-reply", "automate", "save time"] },
  { name: "HandWalking", meaning: "A visit, foot traffic, walking in", keywords: ["visit", "foot traffic", "walk", "nearby", "searches"] },
  { name: "MapPinLocation", meaning: "A place, a location, local", keywords: ["location", "local", "map", "nearby"] },
  { name: "MapMagnifyingGlassSearchLocation", meaning: "Being found in local search", keywords: ["search", "found", "rank", "maps"] },
  { name: "BinocularsSearchSeeingIdentify", meaning: "Looking closely, spotting a problem", keywords: ["inconsistent", "incorrect", "check", "audit", "spot"] },
  { name: "HandThumbsUp", meaning: "Approval, a recommendation", keywords: ["recommend", "good", "approve", "positive"] },
  { name: "HandThumbsDownBad", meaning: "A bad review, disapproval", keywords: ["bad", "low", "one-star", "complaint", "negative"] },
  { name: "HeartLoveGood", meaning: "Trust, being loved", keywords: ["trust", "love", "loyal", "happy"] },
  { name: "LightBulb", meaning: "An idea, a fact, did you know", keywords: ["did you know", "idea", "fact", "tip"] },
  { name: "LightningBoltEnergySpark", meaning: "A spike, momentum, energy", keywords: ["spike", "momentum", "velocity", "surge"] },
  { name: "RocketShipSpace", meaning: "Growth, taking off", keywords: ["growth", "grow", "take off", "up"] },
  { name: "HandClap", meaning: "Applause, a win", keywords: ["win", "great work", "congratulations", "habit"] },
  { name: "CelebrationConfettiPartyPopper", meaning: "Celebration, a milestone", keywords: ["milestone", "celebrate", "first", "hundred"] },
  { name: "LockClosedSecure", meaning: "Gated, part of a plan", keywords: ["pro", "gated", "locked", "plan", "upgrade"] },
  { name: "LockOpenUnlocked", meaning: "Unlocked, included", keywords: ["unlock", "included", "free"] },
  { name: "CoinDollarPaymentMoney", meaning: "Price, money, an offer", keywords: ["price", "discount", "offer", "cost", "half price"] },
  { name: "HandWave", meaning: "Hello, welcome, welcome back", keywords: ["welcome", "back", "hello", "trial ended"] },
  { name: "HeadsetSupportHelp", meaning: "Help, support, a person to talk to", keywords: ["help", "support", "hand"] },
  { name: "Laptop", meaning: "Your website", keywords: ["website", "site", "widget", "embed"] },
  { name: "GlobeWeb", meaning: "The web, online, everywhere", keywords: ["online", "web", "sites", "everywhere"] },
  { name: "NotesWritingPencil", meaning: "Writing, a template, a draft", keywords: ["template", "write", "draft"] },
  { name: "HammerFix", meaning: "Fixing something", keywords: ["fix", "repair", "fix it"] },
  { name: "Star", meaning: "A single star", keywords: ["star"] },
];

export function pickIllustration(keywords: string[]): React.ComponentType<{ className?: string }> {
  const wanted = keywords.map((k) => k.toLowerCase());
  let best = ILLUSTRATIONS[0];
  let bestScore = -1;
  for (const item of ILLUSTRATIONS) {
    const score = item.keywords.reduce((n, k) => n + (wanted.some((w) => w.includes(k) || k.includes(w)) ? 1 : 0), 0);
    if (score > bestScore) { best = item; bestScore = score; }
  }
  return Art[best.name] as React.ComponentType<{ className?: string }>;
}
