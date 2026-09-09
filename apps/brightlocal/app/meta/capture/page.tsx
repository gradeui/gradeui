/**
 * The capture stage: a 1920x1080 canvas holding the app at its own logical
 * size, scaled to fit (Ali, 12 Sep). The initial state comes from the query
 * so the canvas colour is in the first HTML; after that the recorder drives
 * it through `window.__stage` without ever navigating the document, which
 * is what keeps the white flash out of the video.
 *
 *   /meta/capture?url=/locations/harbour-co-hove/reviews&w=1280&h=900
 *                &bg=violet&pad=72&radius=20&caption=...
 */

import { CaptureStage } from "./frame";

export default async function CapturePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const one = (k: string) => (Array.isArray(q[k]) ? q[k]?.[0] : q[k]) as string | undefined;
  return (
    <CaptureStage
      initial={{
        url: one("url") ?? "/locations/minus-one-studios/reviews",
        bg: one("bg") ?? "neutral",
        caption: one("caption"),
        // ?card= paints a cut-scene card on the very first frame, so a
        // video never opens on a bare canvas (Ali, 12 Sep).
        card: one("card") ?? null,
      }}
      w={Number(one("w") ?? 1280)}
      h={Number(one("h") ?? 900)}
      pad={Number(one("pad") ?? 72)}
      radius={Number(one("radius") ?? 20)}
    />
  );
}
