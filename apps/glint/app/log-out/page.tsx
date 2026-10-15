"use client";

// Promoted from Studio screen "Logged out v2"
// (design dmv99za1sq00m, version 1792052820640). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: e36df40479de
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Logged out v2 (15 Oct 2026): where Sign out lands, as the Glint build has
// it (web.staging.glintpay.com/log-out, its "Signed out · Logged out page"
// capture). Ali asked for it in our prototype and in Figma, which had no
// design for it.
//
// AS THE GLINT BUILD HAS IT: the sign in's card (LoginTemplateV2: the ring
// lattice, the wordmark, the gold-framed card, the legal links and the
// copyright), with "You’ve been logged out", "Thanks for using Glint. Log
// back in whenever you’re ready." and one full-width Go home button.
//
// ASSUMPTION, GO HOME: the Glint build's capture does not show where Go home
// leads. Our prototype has no home page outside the console, so it goes to
// the log in (Log in v2), which is where a signed-out person starts.
import * as React from "react";
import { LoginTemplateV2 } from "@/components/login-template-v2";
import { WebDsV2 } from "@/components/web-ds-v2";

const SIGN_IN = "Log in v2";

export default function LoggedOutPage() {
  return (
    <LoginTemplateV2>
      <h1 className="text-4xl" style={{ lineHeight: "40px" }}>
        You’ve been logged out
      </h1>
      <p className="mt-2 text-base leading-6 text-muted-foreground">
        Thanks for using Glint. Log back in whenever you’re ready.
      </p>
      <WebDsV2.Button size="lg" className="mt-8 w-full" data-grade-goto={SIGN_IN}>
        Go home
      </WebDsV2.Button>
    </LoginTemplateV2>
  );
}
