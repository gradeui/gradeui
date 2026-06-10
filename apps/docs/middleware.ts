import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./src/i18n/routing";
import { updateSupabaseSession } from "./lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

/** Routes that REQUIRE a signed-in user when Supabase is configured.
 *  In local-only mode (no Supabase keys) the gate is bypassed for
 *  everything — `pnpm dev` works without sign-up.
 *
 *  Add new gated routes here. Marketing pages, docs, and public
 *  component pages stay open. */
const GATED_PREFIXES = ["/studio", "/accept-invite"];

function isGatedPath(pathname: string): boolean {
  return GATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // /fast-sandbox is the iframe route the Fast renderer loads. It
  // inherits the app's root layout, which would normally wrap it in
  // providers — none of which the iframe needs. Bypass i18n + auth
  // entirely here and stamp the pathname onto a request header so
  // the root layout can detect sandbox routes and render a bare
  // tree. Keep this branch first so neither next-intl nor the
  // auth gate gets a chance to interfere.
  if (pathname.startsWith("/fast-sandbox")) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Public embed (/e/<token>) — like /s/ it's fully public and validates
  // the token server-side, but it renders chrome-free for dropping into
  // an outside site. Stamp the pathname (same as /fast-sandbox) so the
  // root layout renders a BARE tree — no AuthProvider (its config-error
  // banner would surface inside the embed), no Lenis, no Toaster. Keep
  // this before the auth/intl machinery so neither touches it.
  if (pathname.startsWith("/e/")) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Public share links (/s/<token>) — fully public, no auth gate and no
  // i18n rewrite. The route itself validates the token server-side and
  // returns only the one shared screen. Bypass everything else.
  if (pathname.startsWith("/s/")) {
    return NextResponse.next();
  }

  // Always refresh the Supabase session — even on public routes —
  // so the auth cookie stays fresh while a signed-in user browses
  // the marketing site. Returns user=null when Supabase isn't
  // configured (local-only mode) and a no-op response.
  const { response: authResponse, user, authConfigured } =
    await updateSupabaseSession(req);

  // Gated paths (/studio, /accept-invite) are NOT internationalised
  // — they're flat top-level routes. Two things to handle here:
  //   1. When auth is configured + user signed out → redirect to
  //      /sign-in.
  //   2. Either way, do NOT forward to next-intl. Sending them
  //      through intlMiddleware rewrites /studio → /<locale>/studio
  //      which has no matching route tree and 404s.
  if (isGatedPath(pathname)) {
    if (authConfigured && !user) {
      const signIn = new URL("/sign-in", req.url);
      signIn.searchParams.set("next", pathname + req.nextUrl.search);
      const redirect = NextResponse.redirect(signIn);
      // Carry the refreshed auth cookies across the redirect.
      authResponse.cookies.getAll().forEach((cookie) => {
        redirect.cookies.set(cookie);
      });
      return redirect;
    }
    // Open the route directly with the auth response (which is
    // NextResponse.next + refreshed cookies). Bypassing intl.
    return authResponse;
  }

  // intlMiddleware returns its own response; carry the auth cookies
  // across so the session refresh isn't lost.
  const intlResponse = intlMiddleware(req);
  authResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie);
  });
  return intlResponse;
}

export const config = {
  // Match internationalized pathnames only
  // Exclude: api, _next, static files, and non-localized sections (docs, components, brand, changelog, roadmap, blocks)
  matcher: [
    // Match all pathnames except for
    // - API routes (/api/*)
    // - Next.js internals (/_next/*)
    // - Static files (*.*)
    // - Non-localized sections — incl. /layout-preview which has no
    //   [locale] segment in the route tree. Without this exclusion
    //   next-intl rewrites it to /<locale>/layout-preview/<id> and
    //   Next 404s because no matching localized route exists.
    //
    //   /sign-in, /auth, /accept-invite are non-localized too —
    //   they're auth chrome, not content. The auth gate still runs
    //   for /accept-invite because it appears in GATED_PREFIXES
    //   above; the matcher exclusion just keeps next-intl off it.
    //
    //   Note: /fast-sandbox is NOT excluded here on purpose — the
    //   middleware function still needs to run for it to set the
    //   `x-pathname` header the root layout reads to skip its provider
    //   chrome. The function's early return short-circuits before the
    //   intl rewrite happens, so fast-sandbox doesn't break.
    "/((?!api|_next|_vercel|.*\\..*|docs|components|templates|blocks|brand|variables|changelog|roadmap|play|chat|studio|layout-preview|skills|media|v2|sign-in|auth|accept-invite|terms|privacy).*)",
    // Always run for root
    "/",
    // Always run for the gated paths so the auth check fires.
    "/studio/:path*",
    "/accept-invite/:path*",
  ],
};
