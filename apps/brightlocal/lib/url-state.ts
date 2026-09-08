"use client";

/**
 * URL-backed screen state. Promoted screens keep sub-views (a Templates
 * page, a New campaign wizard, an open reply panel) in React state, so
 * the URL never moved and Back left the page instead of closing the
 * view. useUrlParam swaps one useState for a search param: opening a
 * view pushes a history entry, closing it goes back to the base URL,
 * and a link can open the view directly.
 *
 *   const [view, setView] = useUrlParam("view", "campaigns");
 *
 * `set(next, { replace })` uses replaceState for in-view moves that
 * should not stack (a wizard step, a filter), so Back still means
 * "close the view", never "undo the last click".
 */

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useUrlParam<T extends string>(
  key: string,
  fallback: T,
): [T, (next: T | null, opts?: { replace?: boolean }) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const value = (params.get(key) as T | null) ?? fallback;
  const set = React.useCallback(
    (next: T | null, opts?: { replace?: boolean }) => {
      const sp = new URLSearchParams(params.toString());
      if (next === null || next === fallback) sp.delete(key);
      else sp.set(key, next);
      const qs = sp.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (opts?.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [router, pathname, params, key, fallback],
  );
  return [value, set];
}
