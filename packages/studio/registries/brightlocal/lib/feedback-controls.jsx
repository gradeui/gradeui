// @brightlocal/feedback-controls — the three ways a customer can answer.
//
// WHY THIS IS IN THE REGISTRY (Ali, 7 Sep: "I want to change the star rating,
// thumbs, and nps probably at some point, and these will need to be represented
// in design somewhere"). These lived inside the Review Builder screen, which
// made them invisible to the design system and impossible to change in one
// place. They are the single most customer-facing thing the product renders:
// the email preview, the feedback page, the contact sheet, the widget previews
// and the campaign results all draw one of them.
//
// TWO COMPONENTS, TWO JOBS:
//   FeedbackControl  the INPUT. What the customer is asked to click.
//   FeedbackScore    the OUTPUT. What one answer looks like in a results table.
// They are separate because a table cell showing "9" should never accidentally
// become an eleven-button scale, and because their sizes and states differ.
//
// `interactive={false}` renders the control as it will LOOK without wiring the
// clicks, which is what every preview surface wants.
import * as React from "react";
import { Rating } from "@brightlocal/ui-components/rating";
import { Badge } from "@brightlocal/ui-components/badge";
// Star and Badge were used below and never imported, so a star-rating
// preview and every NPS control crashed the page (Builder audit, 10 Sep).
import { ThumbsUp, ThumbsDown, Star } from "@brightlocal/icons";

function FeedbackControl({ type, value, onPick, interactive }) {
  if (type === "nps") {
    return (
      // CIRCLES, AND THEY FIT (Ali, 2 Sep: "NPS score funnily enough doesn't
      // fit… BrightLocal would likely have them as circles?").
      //
      // THE FIT. Eleven fixed 32px buttons plus gaps need ~390px, and the
      // email preview column is 420px minus 72px of padding. They wrapped,
      // which put "10" on a line of its own under "0" — the one layout that
      // makes a 0-to-10 scale unreadable. flex-1 with aspect-square lets the
      // row divide whatever width it is given, so it fits the 420px preview,
      // the full-size dialog and a phone without a breakpoint.
      //
      // CIRCLES, checked against Mobbin rather than guessed. Rounded squares
      // (Typeform, Tally, Expedia, Employment Hero) outnumber circles
      // (Care.com, HubSpot) 4:2, but the four are all general form builders
      // where NPS is one field type among fifty. HubSpot is the real
      // analogue — a B2B tool where a business CONFIGURES an NPS survey its
      // own customers receive, with detractor/passive/promoter bands in the
      // editor, which is exactly this screen — and it uses circles. Care.com
      // is the other genuine end-customer NPS.
      //
      // OPEN, FOR ALI: legacy BrightLocal and HubSpot both COLOUR-GRADE the
      // scale red to green. Kept neutral here because the landing page now
      // wears the business's accent colour and a red-amber-green row would
      // fight it. That is a departure from BrightLocal's own precedent, so
      // it is a decision to take rather than a detail to leave.
      <div className="flex flex-col gap-1.5">
        {/* CAPPED AND CENTRED (Ali, 3 Sep: "the NPS 0-10 scale looks
            shit"). flex-1 alone let each circle grow to fill whatever it was
            given, so in the full-size dialog eleven circles stretched to
            ~50px each and became big hollow rings with the numbers lost in
            the middle — and in the half-scale contact-sheet tile they
            collapsed to about 16px. A max width holds them at a sane size
            and the row centres instead of spreading, so the scale looks the
            same in the tile, the dialog and the live page. */}
        {/* A GRID, NOT FLEX (3 Sep). `flex-1` with `aspect-square` never
            produced circles at any size: flex-basis 0 plus min-w-0 let each
            button shrink to the width of its own digit, and aspect-square
            then squared off THAT, so the control rendered as a bare run of
            numbers with the selected one in a narrow black pill — at full
            size as well as in the tile. Eleven equal grid columns resolve
            from the container, so aspect-square has a real width to work
            from and the circles are actually round. */}
        <div className="mx-auto grid w-full max-w-[26rem] grid-cols-11 gap-1.5">
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              type="button"
              data-hook={`nps-${n}`}
              onClick={() => interactive && onPick(n)}
              className={`focus-visible:ring-ring flex aspect-square w-full items-center justify-center rounded-full border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                value === n
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background border-border"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="text-muted-foreground mx-auto flex w-full max-w-[26rem] justify-between text-xs">
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
      </div>
    );
  }
  if (type === "thumbs") {
    return (
      <div className="flex gap-3">
        {[
          { id: "up", Icon: ThumbsUp, label: "Thumbs up" },
          { id: "down", Icon: ThumbsDown, label: "Thumbs down" },
        ].map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            aria-label={label}
            data-hook={`thumb-${id}`}
            onClick={() => interactive && onPick(id)}
            className={`focus-visible:ring-ring flex size-12 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none ${
              value === id
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-background border-border"
            }`}
          >
            <Icon className="size-5" />
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          data-hook={`star-${n}`}
          onClick={() => interactive && onPick(n)}
          className="focus-visible:ring-ring rounded focus-visible:ring-2 focus-visible:outline-none"
        >
          {/* GOLD, NOT THE BRAND COLOUR (Ali, 2 Sep: "green stars"). A
              filled star was `fill-primary`, which is BrightLocal's green,
              so the customer-facing rating control wore BrightLocal's brand
              on a page that belongs to the business — and a green star does
              not read as a rating at all. Amber is the convention every
              review site uses, and it stays amber whatever brand colour the
              campaign is set to: the star is a UNIT, like a percent sign,
              not a piece of the business's identity. Pure ramp tokens, no
              colour mixing. */}
          <Star
            className={`size-8 ${
              typeof value === "number" && n <= value
                ? "fill-[var(--ds-tailwind-colors-amber-400)] text-[var(--ds-tailwind-colors-amber-500)]"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
function FeedbackScore({ type, score }) {
  if (type === "nps") {
    const tone = score <= 6 ? "destructive" : score <= 8 ? "outline" : "primary";
    return (
      <Badge dataHook={`feedback-score-${score}`} variant={tone} data-number="true">
        {score}
      </Badge>
    );
  }
  if (type === "thumbs") {
    return score >= 7 ? (
      <ThumbsUp className="text-primary size-4 shrink-0" />
    ) : (
      <ThumbsDown className="text-muted-foreground size-4 shrink-0" />
    );
  }
  return <Rating value={Math.max(1, Math.round(score / 2))} dataHook={`feedback-stars-${score}`} />;
}
export { FeedbackControl, FeedbackScore };
