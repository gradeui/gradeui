"use client";

/**
 * A QR code for the location's Google review link, generated in the
 * browser with the open-source `qrcode` package (MIT). The Builder has
 * talked about "a link behind a QR code" all along without ever showing
 * one (Ali, 10 Sep: "fairly simple to have in a banner"). The banner is
 * a live one: the code, a research line, and a scaled live preview of
 * the printable card. Hovering the code opens a small generator: a big
 * preview, the caption and colour to edit, download and print.
 *
 * The code is real and live: it encodes THIS page on the site serving it
 * (on brightlocal-replatform.gradeui.com, the live Builder page), so a
 * phone can scan it off the screen (Ali, 11 Sep). In the product the link
 * would be Google's write-a-review URL,
 * https://search.google.com/local/writereview?placeid=<Place ID>, the
 * same one BrightLocal's free "Google ID and review link generator"
 * produces, from the location's Google Business Profile connection.
 */

import * as React from "react";
import QRCode from "qrcode";
import { Button } from "@brightlocal/ui-components/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@brightlocal/ui-components/dialog";
import { Input } from "@brightlocal/ui-components/input";
import { Download, Printer, QrCode } from "@brightlocal/icons";
import { useLocationKey } from "@/lib/location";
import { DATASETS } from "@brightlocal/data";
import { STATS } from "@/lib/first-run";
import { HandSearchMagnifyingGlass } from "@brightlocal/illustrations";

// SWAP POINT: Ali wants the full-body "Globey with a magnifying glass" scene
// here. It is not in @brightlocal/illustrations 0.6.0; drop the SVG into
// public/globey/ and replace this stand-in.
const BannerArt = HandSearchMagnifyingGlass;

const SAMPLE_PLACE_ID = "ChIJN1t_tDeuEmsRUsoyG83frY4"; // sample, see header
const INK = "#111412";
/** Paper sizes for the printable card (Ali, 11 Sep: "A4, A5, A6"), in mm. */
const SIZES: { id: "A4" | "A5" | "A6"; label: string; where: string; w: number; h: number }[] = [
  { id: "A6", label: "A6", where: "the till or a receipt", w: 105, h: 148 },
  { id: "A5", label: "A5", where: "a table or the counter", w: 148, h: 210 },
  { id: "A4", label: "A4", where: "the door or a window", w: 210, h: 297 },
];

// NEVER window.location.origin (Builder audit, 10 Sep). The printed poster is
// customer-facing: on localhost it read "http://localhost:3020/locations/..."
// under "Scan to leave Minus 1 Studios a Google review", and that is what a
// demo would put on screen. The hosted prototype is the one honest origin, and
// it is the same in the print window, the preview and a screenshot.
const REVIEW_LINK_ORIGIN = "https://brightlocal-replatform.gradeui.com";

export function reviewLinkFor(location: string): string {
  return `${REVIEW_LINK_ORIGIN}/locations/${location}/reviews/builder?utm_source=brightlocal&utm_medium=qr&utm_campaign=${encodeURIComponent(location)}`;
}

/** The product's real target, kept for the notes and the print card. */
export const GOOGLE_REVIEW_LINK = `https://search.google.com/local/writereview?placeid=${SAMPLE_PLACE_ID}`;

function useQrSvg(link: string, ink: string): string {
  const [svg, setSvg] = React.useState("");
  React.useEffect(() => {
    let live = true;
    QRCode.toString(link, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: ink, light: "#0000" } })
      .then((s) => live && setSvg(s))
      .catch(() => {});
    return () => { live = false; };
  }, [link, ink]);
  return svg;
}

/** The printable card, the thing on the till. Rendered live in the banner
 *  at a scale, full size in the generator and the print window. */
function QrCard({ svg, caption, name, link, size }: { svg: string; caption: string; name: string; link: string; size?: { id: string; w: number; h: number } }) {
  // The card keeps the paper's proportions; the preview shows A6 at 320px
  // wide and the larger sizes at the same width, taller.
  const ratio = size ? size.h / size.w : 148 / 105;
  return (
    <div className="flex w-[320px] flex-col items-center justify-center gap-4 rounded-2xl border bg-white px-8 py-8 text-center" style={{ minHeight: 320 * ratio }} data-hook="qr-card">
      {size ? <p className="text-label-sm text-muted-foreground">{size.id}</p> : null}
      <p className="text-heading-section font-display text-balance">{caption}</p>
      <p className="text-body-sm text-muted-foreground text-pretty">Scan to leave {name} a Google review. It takes a minute and it helps more than you know.</p>
      <div className="size-40" dangerouslySetInnerHTML={{ __html: svg }} />
      {/* THE PRINTED URL IS GOOGLE'S, NOT OURS (video audit, 10 Sep). The
          code still encodes this prototype so a phone can scan it off the
          screen, which is what Ali asked for, but the line under it is what
          the product would print, and a gradeui.com address sitting under
          "Scan to leave X a Google review" is the wrong thing on a card a
          customer holds. */}
      <p className="text-body-xs text-muted-foreground break-all">{GOOGLE_REVIEW_LINK.split("?")[0]}</p>
    </div>
  );
}

export function QrBanner({ compact = false }: { compact?: boolean }) {
  const location = useLocationKey();
  const name = (DATASETS as Record<string, { location?: { name?: string } }>)[location]?.location?.name ?? location;
  const [link, setLink] = React.useState("https://brightlocal-replatform.gradeui.com");
  React.useEffect(() => setLink(reviewLinkFor(location)), [location]);
  const [open, setOpen] = React.useState(false);
  const [caption, setCaption] = React.useState("Enjoyed your visit?");
  const [size, setSize] = React.useState(SIZES[0]);
  const svg = useQrSvg(link, INK);
  const dataUrl = svg ? `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` : "";
  const print = () => {
    const w = window.open("", "_blank", "width=480,height=640");
    if (!w) return;
    const scale = size.w / 105; // type and code grow with the paper
    w.document.write(`<title>Review us: ${name}</title><style>@page{size:${size.id} portrait;margin:0}html,body{margin:0}</style><body style="font-family:Inter,system-ui;text-align:center;width:${size.w}mm;height:${size.h}mm;box-sizing:border-box;padding:${12 * scale}mm;display:flex;flex-direction:column;justify-content:center;gap:${6 * scale}mm"><h1 style="font-size:${22 * scale}px;margin:0">${caption}</h1><p style="font-size:${14 * scale}px;color:#555;margin:0">Scan to leave ${name} a Google review. It takes a minute and it helps more than you know.</p><div style="width:${52 * scale}mm;margin:0 auto">${svg}</div><p style="font-size:${10 * scale}px;color:#888;margin:0">${link.split("?")[0]}</p></body>`);
    w.document.close();
    w.focus();
    w.print();
  };
  const fact = STATS.twenty;
  return (
    // Promo cards vary their accent (Ali, 11 Sep): this one is sky, the sells are yellow.
    <section data-hook="qr-banner" className={`flex flex-col gap-5 overflow-hidden rounded-[20px] bg-[var(--ds-tailwind-colors-sky-100)] lg:flex-row lg:items-center ${compact ? "px-5 py-4" : "px-6 py-5"}`}>
      {/* Tap the code for the generator, a proper dialog (Ali, 11 Sep: "hover
          interaction is weird"): preview and edit. */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button type="button" className={`${compact ? "size-20" : "size-32"} shrink-0 cursor-pointer rounded-md bg-white p-1 outline-none ring-offset-2 hover:ring-2 hover:ring-[var(--ds-tailwind-colors-neutral-300)] focus-visible:ring-2`} aria-label="Open the QR code generator" data-hook="qr-banner-code" dangerouslySetInnerHTML={{ __html: svg }} />
        </DialogTrigger>
        <DialogContent dataHook="qr-generator" className="w-[min(96vw,760px)] max-w-none gap-0 overflow-hidden p-0 sm:max-w-none">
          <DialogTitle className="sr-only">QR code generator</DialogTitle>
          <DialogDescription className="sr-only">Preview and edit the review card, then download or print it.</DialogDescription>
          <div className="grid gap-0 sm:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-4 p-5">
              <p className="text-heading-subsection">QR code generator</p>
              <label className="flex flex-col gap-1.5 text-body-sm">
                Caption on the card
                <Input value={caption} onChange={(e) => setCaption(e.target.value)} dataHook="qr-caption" />
              </label>
              <div className="flex flex-col gap-1.5 text-body-sm">
                Paper size
                <div className="flex gap-2">
                  {SIZES.map((sz) => (
                    <button key={sz.id} type="button" onClick={() => setSize(sz)} className={`flex items-center gap-2 rounded-full border px-3 py-1 text-label-sm ${size.id === sz.id ? "border-foreground bg-[var(--ds-tailwind-colors-neutral-100)]" : ""}`} data-hook={`qr-size-${sz.id}`}>
                      {sz.label}
                    </button>
                  ))}
                </div>
                <p className="text-body-xs text-muted-foreground">{size.label} suits {size.where}.</p>
              </div>
              <p className="text-body-xs text-muted-foreground break-all">Opens {link.split("?")[0]}. Scan it with your phone to try.</p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Button variant="primary" size="sm" dataHook="qr-generator-download" asChild>
                  <a href={dataUrl || undefined} download={`review-qr-${location}.svg`}>
                    <Download className="size-4" />
                    Download SVG
                  </a>
                </Button>
                <Button variant="outline" size="sm" dataHook="qr-generator-print" onClick={print}>
                  <Printer className="size-4" />
                  Print for the till
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center bg-[var(--ds-tailwind-colors-neutral-100)] p-5 pt-12 sm:pt-5 sm:pr-14">
              <QrCard svg={svg} caption={caption} name={name} link={link} size={size} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-heading-subsection"><QrCode className="size-4" />Set up a QR code</p>
          {compact ? <BannerArt className="size-12 shrink-0" /> : null}
        </div>
        <p className="text-body-sm text-pretty">
          Put it on the till or the door and customers can leave a review while it is still fresh. Tap the code to preview and print it.
        </p>
        {/* Research, sourced (Ali, 10 Sep: "back it up with research"). */}
        <p className="text-body-sm text-muted-foreground text-pretty">
          <span className="font-semibold text-foreground">{fact.value}</span> {fact.text} <span className="italic">*{fact.source}</span>
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" dataHook="qr-banner-download" asChild>
            <a href={dataUrl || undefined} download={`review-qr-${location}.svg`}>
              <Download className="size-4" />
              Download
            </a>
          </Button>
          <Button variant="outline" size="sm" dataHook="qr-banner-print" onClick={print}>
            <Printer className="size-4" />
            Print for the till
          </Button>
        </div>
      </div>
      {/* The live preview: the printable card, scaled and offset off the
          banner's edge (Ali, 10 Sep: "a scaled live offset widget, basically
          like a live banner"). */}
      {/* No live card here (Ali, 11 Sep: "maybe cheesy"); the card lives in the generator. */}
      {/* Wrapped: the illustration renders a light and a dark twin, and a
          responsive class on it un-hides the twin. */}
      {compact ? null : <div className="hidden shrink-0 lg:block" aria-hidden><BannerArt className="size-28" /></div>}
    </section>
  );
}
