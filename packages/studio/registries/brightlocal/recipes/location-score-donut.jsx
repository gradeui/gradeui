// LocationScoreDonut — The live platform's score ring: donut arc around a big score, with sub-score captions.
// keywords: location score, score donut, donut chart, score ring, progress ring, gauge, score circle, radial score
// components: typography
// Hand-authored to match the live "Location Score" ring (orange arc,
// score/100 centred, Foundation/Visibility sub-scores below). Pure
// decorative SVG — no chart library needed; circumference is 2π×52 ≈
// 326.7, offset = 326.7 × (1 − score/100). Swap stroke-orange-400 per
// score band if desired (their live ring is orange at low scores).

<div className="flex flex-col items-center gap-2" data-hook="location-score">
  <span className="text-muted-foreground text-sm">Location Score</span>
  <div className="relative size-36">
    <svg viewBox="0 0 120 120" className="size-full -rotate-90">
      <circle
        cx="60"
        cy="60"
        r="52"
        fill="none"
        strokeWidth="10"
        className="stroke-muted"
      />
      <circle
        cx="60"
        cy="60"
        r="52"
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="326.7"
        strokeDashoffset={326.7 * (1 - 32 / 100)}
        className="stroke-orange-400"
      />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="font-display text-4xl font-semibold">32</span>
      <span className="text-muted-foreground text-xs">/100</span>
    </div>
  </div>
  <div className="text-muted-foreground flex gap-4 text-xs">
    <span>Foundation 64/100</span>
    <span>Visibility 0/100</span>
  </div>
</div>
