// @brightlocal/preview-frame — the one way a preview is framed.
//
// WHY THIS EXISTS (Ali, 7 Sep: "the Review template has an explicit Preview
// surround, maybe we promote this as a thing we use across screens, having
// this consistent is a good idea"). It was drawn inline on the Review Builder
// and copied, with drift, onto the Review Showcase, where it ended up as a
// frame inside a tinted card inside a sheet ("too many layers"). One
// component, one rule: PreviewFrame is the ONLY wrapper a preview gets. Never
// put it inside another card or tint; it IS the surface that says "this is a
// representation".
//
// THE SHAPE: a dashed border on a muted ground, a small Eye + label row, and
// the preview. `surface="card"` draws the white inner surface for previews of
// a page (the page is white, the frame is not); `surface="none"` for things
// that paint their own surface, such as the review showcase widget.
import * as React from "react";
import { Eye } from "@brightlocal/icons";

export function PreviewFrame({
  label = "Preview",
  // Controls that belong to the preview (device tabs, a page switcher),
  // rendered at the right of the label row.
  trailing = null,
  surface = "card",
  dataHook = "preview-frame",
  className = "",
  children,
}) {
  return (
    {/* SOLID GROUND (Ali, 7 Sep: "the actual surface looks murky, probably
        needs to be solid"). It was bg-muted/40, a translucent tint that took
        on whatever sat behind it and read dirty on a white card. A solid
        token also keeps to the tokens-only rule: no alpha mixes. */}
    <div className={`bg-muted rounded-lg border border-dashed p-4 ${className}`} data-hook={dataHook}>
      <div className="text-muted-foreground mb-3 flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-2">
          <Eye className="size-3.5" aria-hidden="true" />
          <span>{label}</span>
        </span>
        {trailing}
      </div>
      {surface === "card" ? (
        <div className="bg-card mx-auto overflow-hidden rounded-md border shadow-sm">{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
