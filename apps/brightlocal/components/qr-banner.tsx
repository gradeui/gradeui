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

const SAMPLE_PLACE_ID = "ChIJN1t_tDeuEmsRUsoyG83frY4"; // sample, see header
const INKS: { id: string; label: string; hex: string }[] = [
  { id: "black", label: "Black", hex: "#111412" },
  { id: "green", label: "Brand green", hex: "#00691a" },
  { id: "navy", label: "Navy", hex: "#0c2a4a" },
];

export function reviewLinkFor(location: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://brightlocal-replatform.gradeui.com";
  return `${origin}/locations/${location}/reviews/builder?utm_source=brightlocal&utm_medium=qr&utm_campaign=${encodeURIComponent(location)}`;
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
function QrCard({ svg, caption, name, link }: { svg: string; caption: string; name: string; link: string }) {
  return (
    <div className="flex w-[320px] flex-col items-center gap-4 rounded-2xl border bg-white px-8 py-8 text-center" data-hook="qr-card">
      <p className="text-heading-section font-display text-balance">{caption}</p>
      <p className="text-body-sm text-muted-foreground text-pretty">Scan to leave {name} a Google review. It takes a minute and it helps more than you know.</p>
      <div className="size-40" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="text-body-xs text-muted-foreground break-all">{link.split("?")[0]}</p>
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
  const [ink, setInk] = React.useState(INKS[0]);
  const svg = useQrSvg(link, ink.hex);
  const dataUrl = svg ? `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` : "";
  const print = () => {
    const w = window.open("", "_blank", "width=480,height=640");
    if (!w) return;
    w.document.write(`<title>Review us: ${name}</title><body style="font-family:Inter,system-ui;text-align:center;padding:40px"><h1 style="font-size:24px">${caption}</h1><p style="font-size:16px;color:#555">Scan to leave ${name} a Google review. It takes a minute and it helps more than you know.</p><div style="width:280px;margin:24px auto">${svg}</div><p style="font-size:12px;color:#888">${link.split("?")[0]}</p></body>`);
    w.document.close();
    w.focus();
    w.print();
  };
  const fact = STATS.twenty;
  return (
    <section data-hook="qr-banner" className={`flex flex-col gap-5 overflow-hidden rounded-[20px] border bg-[var(--ds-tailwind-colors-base-white)] lg:flex-row lg:items-center ${compact ? "px-5 py-4" : "px-6 py-5"}`}>
      {/* Tap the code for the generator, a proper dialog (Ali, 11 Sep: "hover
          interaction is weird"): preview and edit. */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button type="button" className={`${compact ? "size-16" : "size-20"} shrink-0 cursor-pointer rounded-md bg-white p-1 outline-none ring-offset-2 hover:ring-2 hover:ring-[var(--ds-tailwind-colors-neutral-300)] focus-visible:ring-2`} aria-label="Open the QR code generator" data-hook="qr-banner-code" dangerouslySetInnerHTML={{ __html: svg }} />
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
                Ink
                <div className="flex gap-2">
                  {INKS.map((i) => (
                    <button key={i.id} type="button" onClick={() => setInk(i)} className={`flex items-center gap-2 rounded-full border px-3 py-1 text-label-sm ${ink.id === i.id ? "border-foreground" : ""}`} data-hook={`qr-ink-${i.id}`}>
                      <span className="size-3 rounded-full" style={{ background: i.hex }} />
                      {i.label}
                    </button>
                  ))}
                </div>
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
            <div className="flex items-center justify-center bg-[var(--ds-tailwind-colors-neutral-100)] p-5">
              <QrCard svg={svg} caption={caption} name={name} link={link} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="flex items-center gap-2 text-heading-subsection"><QrCode className="size-4" />Set up a QR code</p>
        <p className="text-body-sm text-pretty">
          This code opens your review page. Put it on the till, the receipt, the menu or the door, and customers can leave a review while it is still fresh. Free, and ready now. Tap the code to preview and edit it.
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
      {compact ? null : (
        <div className="relative hidden h-40 w-72 shrink-0 lg:block" aria-hidden>
          <div className="absolute -bottom-24 left-0 origin-top-left rotate-[-4deg] scale-[0.62] shadow-lg">
            <QrCard svg={svg} caption={caption} name={name} link={link} />
          </div>
        </div>
      )}
    </section>
  );
}
