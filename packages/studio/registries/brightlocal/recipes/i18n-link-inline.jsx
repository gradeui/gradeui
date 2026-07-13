// I18nLinkInline — Using a Link component inside a Trans i18n block for inline translated links.
// keywords: i18n link, trans link, translation link, internationalization link, inline link i18n, react-i18next link
// components: link
// Harvested from BrightLocal's DS MCP (get_composition_recipe "I18nLinkInline") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

import { Trans } from "react-i18next";
import { Link } from "@brightlocal/ui-components/link";

// Translation key in your JSON:
// "terms.agreement": "By signing up you agree to our <link>Terms of Service</link>."

<Trans
  i18nKey="terms.agreement"
  components={{
    link: (
      <Link
        dataHook="i18n-terms-link"
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
      />
    ),
  }}
/>
