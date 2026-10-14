// The live Glint web portal (web.staging.glintpay.com) as a list of named
// states. Each state reaches its frame from a fresh page load, so one broken
// selector costs that frame only.
//
// READ ONLY. A state may open a menu, a drawer or the FIRST step of a flow.
// It must never press Review, Continue, Confirm, Submit, Mark all as read or
// Log out: this is a real account on the client's staging backend.
//
// `figmaPage` is the Web Portal - Full New page the capture slide sits on.
// Login states are not here yet (Ali, 14 Oct: "we can do that after").

/** @typedef {{ name: string, figmaPage: string, full?: boolean, run: (h: Helpers) => Promise<void> }} State */
/** @typedef {{ go: (p: string) => Promise<void>, click: (l: import("playwright").Locator) => Promise<void>, page: import("playwright").Page, btn: (n: string) => import("playwright").Locator }} Helpers */

/** @type {State[]} */
export const STATES = [
  { name: "Wallets", figmaPage: "Wallets", full: true, run: ({ go }) => go("/console/wallets") },
  { name: "Gold", figmaPage: "Wallets", full: true, run: ({ go }) => go("/console/wallets/gold") },
  { name: "Silver", figmaPage: "Wallets", full: true, run: ({ go }) => go("/console/wallets/silver") },
  // Live has no USD detail page: this route renders "No such wallet".
  { name: "USD", figmaPage: "Wallets", run: ({ go }) => go("/console/wallets/usd") },

  { name: "Activity · Gold Zurich", figmaPage: "Wallets", full: true, run: ({ go }) => go("/console/activity?wallet=GGM&page=0") },
  { name: "Activity · Gold Miami", figmaPage: "Wallets", full: true, run: ({ go }) => go("/console/activity?wallet=GGM_USMIA&page=0") },
  { name: "Activity · Silver Zurich", figmaPage: "Wallets", full: true, run: ({ go }) => go("/console/activity?wallet=SIL&page=0") },
  { name: "Activity · Silver Miami", figmaPage: "Wallets", full: true, run: ({ go }) => go("/console/activity?wallet=SIL_USMIA&page=0") },
  { name: "Activity · USD", figmaPage: "Wallets", full: true, run: ({ go }) => go("/console/activity?wallet=USD&page=0") },
  {
    name: "Activity · Wallet menu", figmaPage: "Wallets",
    run: async ({ go, click, page }) => { await go("/console/activity?page=0"); await click(page.getByRole("combobox")); },
  },
  {
    name: "Activity · Statements", figmaPage: "Wallets",
    run: async ({ go, click, page }) => {
      await go("/console/activity?page=0");
      await click(page.getByRole("button", { name: "Statements" }).or(page.getByRole("link", { name: "Statements" })));
    },
  },

  { name: "Notifications", figmaPage: "Notifications", full: true, run: ({ go }) => go("/console/notifications") },
  { name: "Search", figmaPage: "Wallets", run: async ({ go, click, btn }) => { await go("/console/wallets"); await click(btn("Search")); } },
  { name: "Account menu", figmaPage: "Profile", run: async ({ go, click, btn }) => { await go("/console/wallets"); await click(btn("account menu")); } },
  { name: "Profile", figmaPage: "Profile", full: true, run: ({ go }) => go("/console/user/profile") },
  { name: "Addresses", figmaPage: "Profile", full: true, run: ({ go }) => go("/console/user/addresses") },
  { name: "Switch account", figmaPage: "Wallets", run: async ({ go, click, btn }) => { await go("/console/wallets"); await click(btn("Switch account")); } },
  { name: "Sidebar collapsed", figmaPage: "Wallets", run: async ({ go, click, btn }) => { await go("/console/wallets"); await click(btn("Toggle Sidebar")); } },

  { name: "Buy Gold · First step", figmaPage: "Buy", run: async ({ go, click, btn }) => { await go("/console/wallets"); await click(btn("Buy Gold")); } },
  { name: "Buy Silver · First step", figmaPage: "Buy", run: async ({ go, click, btn }) => { await go("/console/wallets"); await click(btn("Buy Silver")); } },
  { name: "Sell Gold · First step", figmaPage: "Sell", run: async ({ go, click, btn }) => { await go("/console/wallets/gold"); await click(btn("Sell")); } },
  { name: "Sell Silver · First step", figmaPage: "Sell", run: async ({ go, click, btn }) => { await go("/console/wallets/silver"); await click(btn("Sell")); } },
  { name: "Deposit · First step", figmaPage: "Deposit", run: async ({ go, click, btn }) => { await go("/console/wallets"); await click(btn("Deposit")); } },
  { name: "Withdraw · First step", figmaPage: "Withdraw", run: async ({ go, click, btn }) => { await go("/console/wallets"); await click(btn("Withdraw")); } },
];
