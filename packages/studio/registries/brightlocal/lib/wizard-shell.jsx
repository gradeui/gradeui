// @brightlocal/wizard-shell — the page chrome every multi-step flow wears.
//
// WHY THIS EXISTS (Ali, 2 Sep): "can we also create a stepper component so it
// isn't all handrolled each time", and "our Stepper should, in code, have a
// page title or stepper title and description (which will probably sit above
// the steps themselves). On Mobile, it should just show the current step."
//
// Two RM wizards were carrying a copy of this layout each — Create Widget on
// its own screen and the widget editor on the list screen — and they had
// already drifted once. A third (the Review Builder campaign wizard) is coming.
// This is the one place that shape lives now.
//
// WHAT THE DS GIVES US, AND WHAT IT DOESN'T
// `Stepper` and its family are real and good, and this wraps them rather than
// redrawing the rail. What the DS has no answer for, and what this file
// supplies:
//
//   1. A TITLE AND DESCRIPTION. Stepper renders a rail and nothing else, so
//      every caller invented its own heading row.
//   2. MOBILE. There is not one responsive class in the shipped stepper.js —
//      no sm:, md: or lg: anywhere. A four-step rail with labels simply
//      squashes on a phone. Below sm this renders the current step as one
//      line instead ("Step 2 of 4 · Reviews") and hides the rail.
//   3. THE PAGE ITSELF: pinned header and footer with only the step scrolling.
//
// Both are worth pushing upstream (report 3.6b, 3.7b): the component exists,
// the pattern around it does not.
//
// NOT SOLVED HERE, and it needs the DS: `active` and `completed` are the same
// two classes in stepper.js —
//     active:    "bg-primary text-primary-foreground"
//     completed: "bg-primary text-primary-foreground"
// so a finished step looks exactly like the one you are on, and by the last
// step the whole rail is solid green (Ali, 2 Sep: "Lots of green on there when
// all 4 are done"). Only the tick-versus-number distinguishes them. Fixing it
// means changing the component, not wrapping it.
import * as React from "react";
import {
  CentredLayout,
  CentredLayoutHeader,
  CentredLayoutContent,
} from "@brightlocal/ui-components/centred-layout";
import { FieldError } from "@brightlocal/ui-components/field";
import {
  Stepper,
  StepperNav,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperSeparator,
  StepperContent,
  StepperTitle,
} from "@brightlocal/ui-components/stepper";

// TOP-LEVEL CARDS ARE WHITE AND BORDERED (Ali, 2 Sep: "all top level cards
// should be bordered and with a white background fill, until we get an
// alternative"). Two token remaps, no literals and no overrides at the call
// site:
//   --card         the DS default is #f2f7f3, a pale green wash (report 3.7)
//   --card-border  the DS default is #ffffff00, fully transparent, so a
//                  filled card ships with no edge at all
// AppLayoutShell already does both for its pages, the second through a scoped
// <style> because border-color cannot ride a token swap. A wizard has no
// shell, so it does it here. Both lines go when the DS fixes the tokens.
// TYPE SCALE INSIDE A WIZARD (Ali, 2 Sep: "text is too big here", on the
// email body and again on the review-sites step).
//
// MEASURED, not guessed, on the live email step at 1280 wide:
//
//   Input / Textarea value   16px   (the DS ships `text-base` on both)
//   FieldLabel                14px
//   FieldDescription          14px
//   CardTitle                 24px  (`text-2xl font-display`)
//
// So the DS is internally inconsistent: the text a user TYPES is a full
// step larger than the label naming it, and in a wizard's narrow single
// column that mismatch is the first thing you see. 16px on form controls
// is a defensible DS-wide choice (it is the size that stops iOS zooming
// the page on focus) but it is not paired with a matching label size, and
// that is a finding for BrightLocal, not something to fix per screen —
// logged in RM-GET-REVIEWS-AND-WIDGETS-REPORT.md.
//
// What this does, and ONLY inside a wizard: brings the control text into
// line with its own label at 14px, and takes the step heading from 24px to
// 18px. A wizard step title sits UNDER a page title that already names the
// task, so 24px was the page's size being used twice. Nothing outside
// WizardShell is touched — the inbox composer and the settings page keep
// the DS default, so this is one surface deviating deliberately rather
// than the tool disagreeing with itself at random.
//
// Written as a scoped <style> on data-slot, not as classNames at each call
// site: there are ~30 inputs across the three wizards and a className on
// each is the "override soup" that makes a screen impossible to re-theme.
// When the DS settles its own scale, delete this block and nothing else.
// 13px, DOWN FROM 14 (Ali, 3 Sep: "can we drop the text size down on the
// inputs"). The DS ships 16px fields against 14px labels, which is the wrong
// way round; 14 fixed the mismatch and 13 settles it — a step's fields now
// read quieter than the question above them, and quieter than the customer
// preview sitting beside them, which is the thing the writer is actually
// looking at.
const WIZARD_TYPE_SCALE = `
[data-hook="__HOOK__-layout"] [data-slot="input"],
[data-hook="__HOOK__-layout"] [data-slot="textarea"],
[data-hook="__HOOK__-layout"] [data-slot="select-trigger"],
[data-hook="__HOOK__-layout"] [data-slot="select-value"] {
  font-size: 0.8125rem;
  line-height: 1.125rem;
}
[data-hook="__HOOK__-layout"] [data-slot="card-title"] {
  font-size: 1.125rem;
  line-height: 1.75rem;
}
`;

const CARD_SURFACE = {
  "--card": "light-dark(var(--ds-tailwind-colors-base-white), var(--ds-tailwind-colors-neutral-900))",
  "--color-card": "light-dark(var(--ds-tailwind-colors-base-white), var(--ds-tailwind-colors-neutral-900))",
  "--card-border": "var(--border)",
  "--color-card-border": "var(--border)",
};

/** The step rail. Full width from sm up; one line below it. */
export function WizardSteps({ steps, value, dataHook = "wizard-stepper", ariaLabel = "Progress" }) {
  const index = steps.findIndex((s) => s.id === value);
  const current = steps[index] ?? steps[0];
  return (
    <>
      {/* BELOW sm — the current step only. A rail of four indicators with
          labels under them needs about 400px before the labels collide, and
          the DS ships nothing responsive, so this is ours. Reads as a
          sentence rather than a squashed diagram. */}
      <p
        data-hook={`${dataHook}-compact`}
        className="text-muted-foreground text-sm sm:hidden"
        aria-hidden
      >
        Step {index + 1} of {steps.length}
        {current?.label ? ` · ${current.label}` : ""}
      </p>

      {/* sm AND UP — the real rail. Read-only: `value` is supplied, so the
          Stepper is CONTROLLED and its setActiveStep only writes internal
          state when it is not, so with no onValueChange a click changes
          nothing. NOT `disabled`: StepperTrigger carries
          `disabled:opacity-50`, which fades the whole rail to half strength
          and makes a finished step look unavailable. */}
      <Stepper
        className="hidden sm:flex"
        dataHook={dataHook}
        steps={steps.map((s) => ({ id: s.id, title: s.label }))}
        value={value}
        ariaLabel={ariaLabel}
      >
        <StepperNav>
          {steps.map((s) => (
            <StepperItem key={s.id} stepId={s.id}>
              <StepperTrigger>
                <StepperIndicator />
                <StepperContent>
                  <StepperTitle>{s.label}</StepperTitle>
                </StepperContent>
              </StepperTrigger>
              <StepperSeparator />
            </StepperItem>
          ))}
        </StepperNav>
      </Stepper>
    </>
  );
}

/**
 * The whole wizard page: pinned header (title, description, rail), a
 * scrolling middle, and a pinned footer.
 *
 * `steps` / `value` are optional — omit them on a terminal state (a done
 * screen) and the rail simply does not render, so the same shell carries the
 * end of the flow without a second layout.
 *
 * ERRORS SIT WITH THE FORM, NOT WITH CANCEL (Ali, 2 Sep: "is this a usual
 * place to show an error message?" — it was not). All three wizards used to
 * put the validation message in the footer bar, inline with Cancel / Back /
 * Next, which is the one place on the page that is about NAVIGATION. The
 * message says something about the fields, so it renders directly under the
 * step content, in the same scrolling column, as the DS `FieldError` —
 * adjacent to the controls and above the actions, which is where a form
 * error is looked for. It is `role="alert"` either way, so this changes
 * where it is SEEN, not whether it is announced.
 *
 * NAMING (Ali, 2 Sep): "Edit and Create are the same flow, so whatever word
 * fits both, or omit Create / Edit / New". `title` is the thing's own name,
 * never the verb. A widget being made for the first time is
 * "Untitled widget", not "New widget", so the header does not change identity
 * halfway through the task.
 */
export function WizardShell({
  title,
  description,
  steps,
  value,
  footer,
  error,
  children,
  dataHook = "wizard",
  contentClassName = "",
}) {
  return (
    <CentredLayout
      dataHook={`${dataHook}-layout`}
      // CentredLayout ships `min-h-screen ... justify-center`, which grows the
      // page and centres the lot. Task chrome has to stay put while the step
      // scrolls, so the root is pinned to h-screen with overflow hidden, the
      // header and footer are shrink-0, and the middle is the only thing that
      // moves. justify-start and gap-0 undo the centring.
      className="h-screen min-h-screen justify-start gap-0 overflow-hidden p-0"
      style={CARD_SURFACE}
    >
      {/* See WIZARD_TYPE_SCALE. Scoped to THIS wizard's own layout hook so
          two wizards on one screen cannot fight, and so the rule cannot
          leak into the app shell behind a closed wizard. */}
      <style>{WIZARD_TYPE_SCALE.replaceAll("__HOOK__", dataHook)}</style>

      <CentredLayoutHeader className="bg-background shrink-0 justify-center border-b px-6 py-4 lg:justify-center">
        <div className="flex w-full max-w-4xl flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold" data-hook={`${dataHook}-title`}>
              {title}
            </p>
            {description ? (
              <p className="text-muted-foreground text-sm" data-hook={`${dataHook}-description`}>
                {description}
              </p>
            ) : null}
          </div>
          {steps?.length ? (
            <WizardSteps steps={steps} value={value} dataHook={`${dataHook}-stepper`} ariaLabel={title} />
          ) : null}
        </div>
      </CentredLayoutHeader>

      <CentredLayoutContent
        className={`min-h-0 flex-1 justify-start overflow-y-auto p-section-sm ${contentClassName}`}
      >
        {/* max-w-4xl, not the auth-card width CentredLayout is usually handed:
            a review picker and a side-by-side preview do not fit in it. */}
        <div className="flex w-full max-w-4xl flex-col gap-4">
          {children}
          {/* Under the step, not in the footer. See the note above. */}
          {error ? (
            <FieldError dataHook={`${dataHook}-error`} role="alert">
              {error}
            </FieldError>
          ) : null}
        </div>
      </CentredLayoutContent>

      {footer ? (
        <div
          data-hook={`${dataHook}-footer`}
          className="bg-background w-full shrink-0 border-t px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-2">{footer}</div>
        </div>
      ) : null}
    </CentredLayout>
  );
}
