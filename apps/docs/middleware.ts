import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // /fast-sandbox is the iframe route the Fast renderer loads. It
  // inherits the app's root layout, which would normally wrap it in
  // AuthProvider + LenisProvider + Toaster — none of which the iframe
  // needs, and AuthProvider specifically surfaces the app's persistent
  // Auth.js config error *inside* the iframe, which is confusing. We
  // bypass i18n entirely here and stamp the pathname onto a request
  // header so the root layout can detect sandbox routes and render a
  // bare tree. Keep this branch first — before intlMiddleware — so
  // next-intl doesn't get a chance to locale-resolve this path.
  if (pathname.startsWith("/fast-sandbox")) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return intlMiddleware(req);
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
    //   Note: /fast-sandbox is NOT excluded here on purpose — the
    //   middleware function still needs to run for it to set the
    //   `x-pathname` header the root layout reads to skip its provider
    //   chrome. The function's early return short-circuits before the
    //   intl rewrite happens, so fast-sandbox doesn't break.
    "/((?!api|_next|_vercel|.*\\..*|docs|components|templates|blocks|brand|changelog|roadmap|play|chat|studio|layout-preview|skills|media).*)",
    // Always run for root
    "/",
  ],
};
