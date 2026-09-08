"use client";

/**
 * A QR code for the location's Google review link, generated in the
 * browser with the open-source `qrcode` package (MIT). The Builder has
 * talked about "a link behind a QR code" all along without ever showing
 * one (Ali, 10 Sep: "fairly simple to have in a banner"). Small band:
 * the code, one line on where to put it, download and print.
 *
 * ASSUMPTION (for Ali): the link is Google's write-a-review URL format,
 * https://search.google.com/local/writereview?placeid=<Place ID>, the
 * same one BrightLocal's free "Google ID and review link generator"
 * produces. The Place ID here is a sample: the real one comes from the
 * location's Google Business Profile connection.
 */

import * as React from "react";
import QRCode from "qrcode";
import { Button } from "@brightlocal/ui-components/button";
import { Download, Printer, QrCode } from "@brightlocal/icons";
import { useLocationKey } from "@/lib/location";
import { DATASETS } from "@brightlocal/data";

const SAMPLE_PLACE_ID = "ChIJN1t_tDeuEmsRUsoyG83frY4"; // sample, see header

export function reviewLinkFor(location: string): string {
  return `https://search.google.com/local/writereview?placeid=${SAMPLE_PLACE_ID}&utm_source=brightlocal&utm_medium=qr&utm_campaign=${encodeURIComponent(location)}`;
}

export function QrBanner({ compact = false }: { compact?: boolean }) {
  const location = useLocationKey();
  const name = (DATASETS as Record<string, { location?: { name?: string } }>)[location]?.location?.name ?? location;
  const link = reviewLinkFor(location);
  const [svg, setSvg] = React.useState<string>("");
  React.useEffect(() => {
    let live = true;
    QRCode.toString(link, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#111412", light: "#0000" } })
      .then((s) => live && setSvg(s))
      .catch(() => {});
    return () => { live = false; };
  }, [link]);
  const dataUrl = svg ? `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` : "";
  const print = () => {
    const w = window.open("", "_blank", "width=480,height=640");
    if (!w) return;
    w.document.write(`<title>Review us: ${name}</title><body style="font-family:Inter,system-ui;text-align:center;padding:40px"><h1 style="font-size:24px">Enjoyed your visit?</h1><p style="font-size:16px;color:#555">Scan to leave ${name} a Google review. It takes a minute and it helps more than you know.</p><div style="width:280px;margin:24px auto">${svg}</div><p style="font-size:12px;color:#888">${link}</p></body>`);
    w.document.close();
    w.focus();
    w.print();
  };
  return (
    <section data-hook="qr-banner" className={`flex items-center gap-5 rounded-[20px] border bg-[var(--ds-tailwind-colors-base-white)] ${compact ? "px-5 py-4" : "px-6 py-5"}`}>
      <div className={`${compact ? "size-16" : "size-20"} shrink-0 rounded-md bg-white p-1`} aria-label="QR code for your Google review link" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex items-center gap-2 text-heading-subsection"><QrCode className="size-4" />Set up a QR code</p>
        <p className="text-body-sm text-pretty">
          This code opens your Google review page. Put it on the till, the receipt, the menu or the door, and customers can leave a review while it is still fresh. Free, and ready now.
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
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
    </section>
  );
}
