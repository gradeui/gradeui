"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { useMapContext } from "./context";
import type { Coords, MapMarkerProps, MarkerHandle } from "./types";

const MapMarker = React.memo(function MapMarker({
  id,
  at,
  anchor = "bottom",
  className,
  children,
  onClick,
}: MapMarkerProps) {
  const ctx = useMapContext();
  const [el, setEl] = React.useState<HTMLElement | null>(null);
  const handleRef = React.useRef<MarkerHandle | null>(null);
  const onClickRef = React.useRef(onClick);
  React.useEffect(() => {
    onClickRef.current = onClick;
  });

  // Register on mount; re-register if context becomes available later.
  // We deliberately don't depend on `at` / `anchor` here — those are pushed
  // imperatively below to avoid expensive re-registration on every move.
  React.useEffect(() => {
    if (!ctx) return;
    const handle = ctx.registerMarker(id, at, anchor);
    if (handle) {
      handleRef.current = handle;
      setEl(handle.element);

      const onDomClick = (e: MouseEvent) => {
        onClickRef.current?.({ id, coords: handle.coords, native: e });
      };
      handle.element.addEventListener("click", onDomClick);

      return () => {
        handle.element.removeEventListener("click", onDomClick);
        handle.remove();
        handleRef.current = null;
        setEl(null);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, id]);

  // Update marker position when `at` changes — no re-register.
  React.useEffect(() => {
    handleRef.current?.setPosition(at as Coords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at[0], at[1]]);

  if (!el) return null;

  return createPortal(
    <div
      data-gds-part="map-marker-content"
      className={cn("pointer-events-auto", className)}
    >
      {children}
    </div>,
    el
  );
});

MapMarker.displayName = "MapMarker";

export { MapMarker };
