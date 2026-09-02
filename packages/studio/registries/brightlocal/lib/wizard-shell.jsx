// @brightlocal/wizard-shell — the page chrome every multi-step flow wears.
//
// WHY THIS EXISTS (Ali, 2 Sep): "can we also create a stepper component so it
// isn't all handrolled each time", and "our Stepper should, in code, have a
// page title or stepper title and description (which will probably sit above
// the steps themselves). On Mobile, it should just show the current step."
//
// Two RM wizards were carrying a copy of this layout each — Create Widget on
// its own screen and the widget editor on the list screen — and they had
// already drifted once. A third (the Get Reviews campaign wizard) is coming.
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
        <div className="flex w-full max-w-4xl flex-col gap-4">{children}</div>
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
