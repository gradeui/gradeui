// @brightlocal/dropzone — the file drop target the DS does not ship.
//
// WHY THIS EXISTS (Ali, 7 Sep: "can we create a dropzone component... as we
// will have this in more than one place"). It already was in more than one
// place: Review Builder hand-rolled one for the CSV contact list and a second
// for the logo, and the two had drifted apart in padding and copy before either
// was a day old.
//
// CHECKED FIRST, as always. @brightlocal/ui-components has no file component:
// its component-meta lists seven and none of them touch files, and there is no
// input[type=file] anywhere in the dist. shadcn ships one now
// (`npx shadcn add file-upload`) and there are community versions, but pulling
// one in means a new npm dependency, a registry lib entry, and the panel
// renderer blocks network, so a local component is the cheaper answer. The
// SHAPE follows shadcn's: dashed border, icon, a line of instruction, a line of
// constraint, and a filled state that shows what was chosen.
//
// A BUTTON, NOT A DIV. It is a single activatable control, so it gets a real
// <button>: keyboard focus, Enter and Space, and a focus ring, none of which a
// div with onClick has. `onDrop` is wired for real dragging too, and dragover
// must preventDefault or the browser opens the file instead.
import * as React from "react";
import { Upload } from "@brightlocal/icons";

export function Dropzone({
  // What has already been chosen. Pass a string to show the filled state.
  value,
  // Shown under the headline when empty: the constraint, not a repeat of the
  // instruction. Sizes, formats, row shapes.
  hint,
  // Empty-state headline. Says the action and both ways of doing it.
  label = "Drop your file here, or choose one",
  // Filled-state second line, e.g. "120 rows" or "720 by 720".
  meta,
  Icon = Upload,
  onSelect,
  disabled = false,
  dataHook = "dropzone",
  className = "",
}) {
  const [over, setOver] = React.useState(false);
  const filled = Boolean(value);

  return (
    <button
      type="button"
      data-hook={dataHook}
      disabled={disabled}
      aria-label={filled ? `${value}. Choose a different file` : label}
      onClick={() => onSelect?.()}
      onDragOver={(e) => {
        // Without preventDefault the browser navigates to the dropped file.
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onSelect?.(e.dataTransfer?.files?.[0]);
      }}
      className={[
        "focus-visible:ring-ring flex w-full flex-col items-center gap-1 rounded-lg border border-dashed p-6",
        "transition-colors focus-visible:ring-2 focus-visible:outline-none",
        // The drag state is the same treatment as hover, so the target reads
        // identically whether you are pointing at it or dragging over it.
        over ? "border-primary bg-primary/5" : "border-border hover:border-primary",
        disabled ? "cursor-not-allowed opacity-60" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon className={filled ? "text-primary size-6" : "text-muted-foreground size-6"} />
      <span className="text-sm font-medium">{filled ? value : label}</span>
      {filled ? (
        <span className="text-muted-foreground text-xs">
          {meta ? `${meta}, click to replace` : "Click to replace"}
        </span>
      ) : hint ? (
        <span className="text-muted-foreground text-xs">{hint}</span>
      ) : null}
    </button>
  );
}
