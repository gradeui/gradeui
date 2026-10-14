// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// TransferV2 (7 Oct 2026, REWORKED 14 Oct): Deposit and Withdraw for the
// Glint business portal v2 on staging, as "Glint - Web Portal - Full New"
// draws them on its Deposit page (USD · Deposit · 1 Choose method, 2 ACH
// transfer, 3 Wire transfer) and Withdraw page (USD · Withdraw, Review,
// Requested). Opened from the USD card's Deposit and Withdraw.
//
// TWIN: the Studio shared component "TransferV2" (cmuyiqiijarq57). Editing one does
// not touch the other. Keep the pair in sync.
//
//   <TransferV2.Deposit><Button>Deposit</Button></TransferV2.Deposit>
//   <TransferV2.Withdraw><Button>Withdraw</Button></TransferV2.Withdraw>
//
// DEPOSIT, one drawer in three steps (14 Oct):
//   - Choose method: "Choose how you want to add US dollars to your
//     wallet." over two Web DS OptionRows (chevron, a 48 muted tile with
//     the landmark icon, tile and chevron topped to the title): ACH
//     transfer and Wire transfer, each with its fee, limits and timing.
//   - ACH transfer / Wire transfer: a round Back, "Send an ACH (a wire)
//     using the details below.", the details on a muted panel (stacked
//     Web DS DescriptionItems, every one with copy: Account name, the
//     routing number, Account number, Bank name, Bank address), the rail's
//     limits note, and Share details in the footer.
//   Money arrives from outside the app (Ali, 1 Oct), so there is no form.
//
// WITHDRAW, one drawer that walks Form > Review > Requested (14 Oct, Full
// New has dropped the 7 Oct wire option and the account type):
//   - Form: Amount ($ prefix, USD suffix, "$X available"); Account holder
//     name ("Must match your business name"), Routing number, Account
//     number, Confirm account number; Review withdrawal in the footer.
//   - Review: a round Back, "Check the details before you confirm."; Amount,
//     Fee (Free), Total from USD wallet; "Arrives 1 to 3 business days
//     after approval."; "Sending to" and the holder, routing number and
//     account number. Confirm withdrawal.
//   - Requested: "We’ve sent your request to our team for approval.";
//     Reference ID (copy), Status, Amount, To, Arrives. Done.
//
// THE DATA, as entities (glint-data-modelling): a withdrawal is { id,
// rail "ach", amount, fee, status ("in-review"), recipient: { holder,
// routingNumber, accountLast4 } }. Every sentence on screen is composed
// from those fields ("Acme Corp, account ending 2502"), never stored.
// Confirming keeps the withdrawal for the tab (FlowStore
// "transfer.withdrawals"), takes the total from the USD wallet, and adds
// a pending activity row, so the card and the lists move.
//
// A DEMO: nothing is sent, nothing leaves the browser tab, no bank is
// contacted. The bank details are typed by the person and kept only in
// this drawer's state until it closes.
//
// ASSUMPTIONS, NOT IN FIGMA:
//   - THE DEPOSIT NUMBERS STAY MINTED. Full New shows routing numbers
//     that look like the sponsor bank's real ones (041215663, 041208777)
//     and a 12 digit account number; the demo's rule since 11 Aug is that
//     no number shown can address a real account (see Accounts), so the
//     ACH routing number and the account number are Accounts' minted
//     pair and the wire routing number is minted the same way
//     (041208531, checksum valid). The names and address follow Figma.
//   - Share details opens the device's share sheet with the details as
//     text, or copies them where there is none and says "Details copied".
//   - Review looks live from the start, as the Withdraw slide draws it;
//     pressed with something missing, it turns the missing fields'
//     borders destructive and moves to the first one, with no new copy.
//     An amount over the wallet says "$X more than your USD wallet holds."
import * as React from "react";
import { Landmark } from "lucide-react";
import { Persona } from "@/lib/persona";
import { Accounts } from "@/lib/accounts";
import { FlowStore } from "@/lib/flow-store";
import { SideDrawer } from "@/components/side-drawer";
import { WebDsV2 } from "@/components/web-ds-v2";

/* Deposit methods, as the Choose method slide words them. The routing
   numbers are minted: see the header. */
const DEPOSIT = {
  ach: {
    title: "ACH transfer",
    description: "No fee. $10 to $200,000 a day from a bank account in your business name. Arrives in 1 to 3 business days.",
    intro: "Send an ACH using the details below.",
    routingLabel: "ACH routing number",
    routing: null /* Accounts' minted ACH number, read at render */,
    note: "Limits are $10 minimum and $200,000 maximum a day. We only accept deposits from a bank account in your business name.",
  },
  wire: {
    title: "Wire transfer",
    description: "$25 fee per wire. $500 to $200,000 a day from a US bank account in your business name. Arrives in 1 to 2 business days.",
    intro: "Send a wire using the details below.",
    routingLabel: "Wire routing number",
    routing: "041208531",
    note: "Wires have a $25 incoming fee. Limits are $500 minimum and $200,000 maximum a day. Wires under $500 will be returned.",
  },
};
const DEPOSIT_TO = {
  accountName: "Glint Pay",
  bankName: "Sutton Bank",
  bankAddress: "1 S Main Street, Attica, OH 44807",
};

const RAIL = {
  ach: {
    label: "ACH",
    fee: 0,
    cost: "free",
    helper: "Free. Arrives 1 to 3 business days after approval.",
    arrives: "1 to 3 business days after approval",
    arrivesNote: "Arrives 1 to 3 business days after approval.",
    review: "Review withdrawal",
    confirm: "Confirm withdrawal",
    done: "Withdrawal requested",
  },
  wire: {
    label: "Wire",
    fee: 25,
    cost: "$25 fee",
    helper: "$25 fee. Arrives the same business day if approved before 2pm ET.",
    arrives: "Same business day if approved before 2pm ET",
    arrivesNote: "Arrives the same business day if approved before 2pm ET.",
    review: "Review wire",
    confirm: "Confirm wire",
    done: "Wire requested",
  },
};
const STATUS_LABEL = { "in-review": "In review" };

/** "WD-7K2F-9Q4X": a reference made up in the browser for the demo. */
function newReference() {
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const pick = () => A[Math.floor(Math.random() * A.length)];
  return `WD-${Array.from({ length: 4 }, pick).join("")}-${Array.from({ length: 4 }, pick).join("")}`;
}

function Note({ children }) {
  return <p className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{children}</p>;
}

/** Deposit: Choose method, then the ACH or wire details to send to. */
function Deposit({ children }) {
  const [open, setOpen] = React.useState(false);
  const [method, setMethod] = React.useState(null);
  const [shared, setShared] = React.useState(false);
  const close = (next) => {
    setOpen(next);
    if (!next) {
      setMethod(null);
      setShared(false);
    }
  };
  const m = method ? DEPOSIT[method] : null;
  const rows = m
    ? [
        { label: "Account name", value: DEPOSIT_TO.accountName },
        { label: m.routingLabel, value: m.routing ?? Accounts.ALL.fiat.routingNumber },
        { label: "Account number", value: Accounts.numberFull("fiat") },
        { label: "Bank name", value: DEPOSIT_TO.bankName },
        { label: "Bank address", value: DEPOSIT_TO.bankAddress },
      ]
    : [];
  const share = async () => {
    const text = `${m.title}\n` + rows.map((r) => `${r.label}: ${r.value}`).join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: `Glint ${m.title.toLowerCase()} details`, text });
        return;
      }
    } catch {
      /* dismissed or refused: fall through to copying */
    }
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      /* no clipboard in this frame: the label still confirms */
    }
    setShared(true);
    window.setTimeout(() => setShared(false), 1600);
  };

  return (
    <SideDrawer open={open} onOpenChange={close} trigger={children}>
      {m ? (
        <SideDrawer.Header inset="sheet" onBack={() => setMethod(null)} title={m.title} description={m.intro} />
      ) : (
        <SideDrawer.Header
          inset="sheet"
          title="Deposit"
          description="Choose how you want to add US dollars to your wallet."
        />
      )}
      <SideDrawer.Body>
        {m ? (
          <div className="flex flex-col gap-4">
            <WebDsV2.Summary>
              {rows.map((r) => (
                <WebDsV2.DescriptionItem key={r.label} layout="stacked" label={r.label} value={r.value} copy={r.value} />
              ))}
            </WebDsV2.Summary>
            <Note>{m.note}</Note>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(DEPOSIT).map(([key, d]) => (
              <WebDsV2.OptionRow
                key={key}
                trailing="chevron"
                tile="box"
                align="start"
                logo={<Landmark aria-hidden />}
                title={d.title}
                description={d.description}
                onSelect={() => setMethod(key)}
              />
            ))}
          </div>
        )}
      </SideDrawer.Body>
      {m ? (
        <SideDrawer.Footer>
          <WebDsV2.Button size="xl" className="w-full" onClick={share}>
            {shared ? "Details copied" : "Share details"}
          </WebDsV2.Button>
        </SideDrawer.Footer>
      ) : null}
    </SideDrawer>
  );
}

const EMPTY = {
  amount: "",
  rail: "ach",
  holder: "",
  routing: "",
  account: "",
  confirm: "",
};

/** Withdraw: Form, Review, Requested in one drawer. */
function Withdraw({ children }) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState("form");
  const [f, setF] = React.useState(EMPTY);
  const [done, setDone] = React.useState(null);
  const [fiat, setFiat] = Persona.useBalance("fiat");
  const [kept, setKept] = FlowStore.useField("transfer.withdrawals", []);
  const { add: addActivity } = Persona.useLiveActivity();

  const rail = RAIL[f.rail];
  const amount = Number.parseFloat(f.amount.replace(/,/g, ""));
  const has = Number.isFinite(amount) && amount > 0;
  const total = has ? amount + rail.fee : 0;
  const over = has && total > fiat + 0.005;
  const digits = (v) => v.replace(/\D/g, "");
  /* What is still missing, in the order the fields appear. */
  const problems = {
    amount: !has || over,
    holder: !f.holder.trim(),
    routing: digits(f.routing).length !== 9,
    account: digits(f.account).length < 4,
    confirm: digits(f.account) !== digits(f.confirm) || !f.confirm,
  };
  const FIELD_ID = {
    amount: "withdraw-amount",
    holder: "withdraw-holder",
    routing: "withdraw-routing",
    account: "withdraw-account",
    confirm: "withdraw-confirm",
  };
  const firstProblem = Object.keys(problems).find((k) => problems[k]);
  const [tried, setTried] = React.useState(false);
  const bad = (k) => tried && problems[k];
  const toReview = () => {
    if (firstProblem) {
      setTried(true);
      document.getElementById(FIELD_ID[firstProblem])?.focus();
      return;
    }
    setStep("review");
  };

  const set = (key) => (e) => setF((x) => ({ ...x, [key]: e.target.value }));
  const close = (next) => {
    setOpen(next);
    if (!next) {
      setStep("form");
      setF(EMPTY);
      setDone(null);
      setTried(false);
    }
  };

  const confirm = () => {
    const at = Date.now();
    const w = {
      id: newReference(),
      rail: f.rail,
      amount,
      fee: rail.fee,
      status: "in-review",
      createdAt: at,
      recipient: {
        holder: f.holder.trim(),
        routingNumber: digits(f.routing),
        accountLast4: digits(f.account).slice(-4),
      },
    };
    setKept([w, ...kept]);
    setFiat(Math.max(0, Math.round((fiat - total) * 100) / 100));
    const stamped = new Date(at - new Date(at).getTimezoneOffset() * 60000).toISOString().slice(0, 19);
    addActivity({
      id: `tx-live-${at}`,
      kind: "withdrawal",
      description: "Withdrawal from USD",
      timestamp: stamped,
      metalAmount: null,
      metal: null,
      fiatAmount: -total,
      type: "withdrawal",
      status: "pending",
      account: "fiat",
      counterAccount: "external",
      method: f.rail,
      fee: rail.fee || undefined,
      reference: w.id,
    });
    setDone(w);
    setStep("done");
  };

  let header;
  let body;
  let footer;
  if (step === "done" && done) {
    const r = RAIL[done.rail];
    header = (
      <SideDrawer.Header inset="sheet" title={r.done} description="We’ve sent your request to our team for approval." />
    );
    body = (
      <WebDsV2.Summary>
        <WebDsV2.DescriptionItem layout="stacked" label="Reference ID" value={done.id} copy={done.id} />
        <WebDsV2.DescriptionItem layout="stacked" label="Status" value={STATUS_LABEL[done.status]} />
        <WebDsV2.DescriptionItem layout="stacked" label="Amount" value={Persona.fmtMoney(done.amount)} />
        <WebDsV2.DescriptionItem
          layout="stacked"
          label="To"
          value={`${done.recipient.holder}, account ending ${done.recipient.accountLast4}`}
        />
        <WebDsV2.DescriptionItem layout="stacked" label="Arrives" value={r.arrives} />
      </WebDsV2.Summary>
    );
    footer = (
      <WebDsV2.Button size="xl" className="w-full" onClick={() => close(false)}>
        Done
      </WebDsV2.Button>
    );
  } else if (step === "review") {
    header = (
      <SideDrawer.Header
        inset="sheet"
        onBack={() => setStep("form")}
        title={rail.review}
        description="Check the details before you confirm."
      />
    );
    body = (
      <div className="flex flex-col gap-4">
        <WebDsV2.Summary>
          <WebDsV2.DescriptionItem label="Amount" value={Persona.fmtMoney(amount)} />
          <WebDsV2.DescriptionItem label="Fee" value={rail.fee ? Persona.fmtMoney(rail.fee) : "Free"} />
          <WebDsV2.Divider />
          <WebDsV2.DescriptionItem label="Total from USD wallet" value={Persona.fmtMoney(total)} emphasis="total" />
        </WebDsV2.Summary>
        <span className="text-xs leading-4 text-[color:var(--wds-muted-foreground)]">{rail.arrivesNote}</span>
        <span className="text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">Sending to</span>
        <WebDsV2.Summary>
          <WebDsV2.DescriptionItem label="Account holder" value={f.holder.trim()} />
          <WebDsV2.DescriptionItem label="Routing number" value={digits(f.routing)} />
          <WebDsV2.DescriptionItem label="Account number" value={digits(f.account)} />
        </WebDsV2.Summary>
      </div>
    );
    footer = (
      <WebDsV2.Button size="xl" className="w-full" onClick={confirm}>
        {rail.confirm}
      </WebDsV2.Button>
    );
  } else {
    header = (
      <SideDrawer.Header
        inset="sheet"
        title="Withdraw"
        description="Move money from your USD wallet to your business bank account."
      />
    );
    body = (
      <div className="flex flex-col gap-4">
        <WebDsV2.Field
          label="Amount"
          htmlFor="withdraw-amount"
          helper={`${Persona.fmtMoney(fiat)} available`}
          error={over ? `${Persona.fmtMoney(total - fiat)} more than your USD wallet holds.` : null}
        >
          <WebDsV2.Input
            id="withdraw-amount"
            size="default"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            prefix="$"
            suffix="USD"
            invalid={over || bad("amount")}
            value={f.amount}
            onChange={set("amount")}
          />
        </WebDsV2.Field>
        <WebDsV2.Field label="Account holder name" htmlFor="withdraw-holder" helper="Must match your business name">
          <WebDsV2.Input id="withdraw-holder" size="default" invalid={bad("holder")} autoComplete="off" placeholder="Business name" value={f.holder} onChange={set("holder")} />
        </WebDsV2.Field>
        <WebDsV2.Field label="Routing number" htmlFor="withdraw-routing">
          <WebDsV2.Input id="withdraw-routing" size="default" invalid={bad("routing")} inputMode="numeric" autoComplete="off" placeholder="9 digits" value={f.routing} onChange={set("routing")} />
        </WebDsV2.Field>
        <WebDsV2.Field label="Account number" htmlFor="withdraw-account">
          <WebDsV2.Input id="withdraw-account" size="default" invalid={bad("account")} inputMode="numeric" autoComplete="off" placeholder="Account number" value={f.account} onChange={set("account")} />
        </WebDsV2.Field>
        <WebDsV2.Field label="Confirm account number" htmlFor="withdraw-confirm">
          <WebDsV2.Input id="withdraw-confirm" size="default" invalid={bad("confirm")} inputMode="numeric" autoComplete="off" placeholder="Re-enter account number" value={f.confirm} onChange={set("confirm")} />
        </WebDsV2.Field>
      </div>
    );
    footer = (
      <WebDsV2.Button size="xl" className="w-full" onClick={toReview}>
        {rail.review}
      </WebDsV2.Button>
    );
  }

  return (
    <SideDrawer open={open} onOpenChange={close} trigger={children}>
      {header}
      <SideDrawer.Body>{body}</SideDrawer.Body>
      <SideDrawer.Footer>{footer}</SideDrawer.Footer>
    </SideDrawer>
  );
}

/** Marker component satisfying the export-name contract; the statics are
 *  the API. */
function TransferV2() {
  return null;
}
TransferV2.Deposit = Deposit;
TransferV2.Withdraw = Withdraw;
TransferV2.RAIL = RAIL;

/* Exported untyped: the body is plain JSX (see the header). */
const __TransferV2: any = TransferV2;
export { __TransferV2 as TransferV2 };
