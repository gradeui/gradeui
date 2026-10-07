// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// TransferV2 (7 Oct 2026): Deposit, and Withdraw by ACH or wire, for the
// Glint business portal v2 on staging, as "Glint - Web Portal - Full New"
// designs them on its "Withdraw & Transfer" page: USD · Deposit; USD ·
// Withdraw, Review, Requested; USD · Withdraw · Wire, Wire · Review, Wire
// · Requested. Opened from the USD card's Deposit and Withdraw.
//
// TWIN: the Studio shared component "TransferV2" (cmuyiqiijarq57). Editing one does
// not touch the other. Keep the pair in sync.
//
//   <TransferV2.Deposit><Button>Deposit</Button></TransferV2.Deposit>
//   <TransferV2.Withdraw><Button>Withdraw</Button></TransferV2.Withdraw>
//
// FIGMA NOW DESIGNS WITHDRAW, so it is built, although withdrawing used
// to be a manual support process and Ali's 1 Oct web scope was Buy and
// Sell only (glint-product-facts). "Transfer" on the page is the wire, the
// second way to send.
//
// DEPOSIT: the Glint account's details on a muted panel (stacked Web DS
// DescriptionItems, copy on the routing and account numbers) and "Send a
// domestic wire or ACH to these details to fund your USD wallet." Money
// arrives from outside the app (Ali, 1 Oct), so there is no form.
//
// WITHDRAW, one drawer that walks Form > Review > Requested:
//   - Amount ($ prefix, USD suffix, "$X available"); Send by, ACH or Wire
//     (Web DS segmented, full width) with its cost and timing under it;
//     then the recipient's bank details (ACH: holder, routing and account
//     type side by side, account number, confirm; wire: holder, bank name,
//     wire routing number, account number, confirm, reference). The
//     footer says "We don’t save bank details, so you’ll enter them each
//     time." over "Review withdrawal" / "Review wire".
//   - Review: Back, "Review withdrawal" / "Review wire", "Check the details
//     before you confirm."; Amount, Fee (Free) or Wire fee ($25.00), Total
//     from USD wallet; when it arrives; "Sending to" and the details; on a
//     wire the warning Alert "Wires can’t be reversed". Footer: "Our team
//     checks and approves every withdrawal before it’s sent." over
//     "Confirm withdrawal" / "Confirm wire".
//   - Requested: "Withdrawal requested" / "Wire requested", "We’ve sent
//     your request to our team for approval."; Reference ID (copy),
//     Status, Amount, Send by, To, Arrives; "Quote your reference ID if you
//     contact us about this withdrawal." over Done.
//
// THE DATA, as entities (glint-data-modelling): a withdrawal is { id,
// rail ("ach" | "wire"), amount, fee, status ("in-review"), recipient:
// { holder, bankName, routingNumber, accountNumber, accountType,
// reference } }. Every sentence on screen is composed from those fields
// and the label maps below ("ACH, free", "Acme Corp, account ending
// 2502"), never stored. Confirming keeps the withdrawal for the tab
// (FlowStore "transfer.withdrawals"), takes the total from the USD wallet,
// and adds a pending activity row, so the card and the lists move.
//
// A DEMO: nothing is sent, nothing leaves the browser tab, no bank is
// contacted. The bank details are typed by the person and kept only in
// this drawer's state until it closes (the withdrawal record keeps the
// last four of the account, not the number).
//
// ASSUMPTIONS, NOT IN FIGMA:
//   - Review looks live from the start, as the Withdraw slides draw it;
//     pressed with something missing, it turns the missing fields'
//     borders destructive (the Web DS Input invalid state) and moves to
//     the first one, with no new copy. An amount over what the wallet
//     holds says "$X more than your USD wallet holds." under the field
//     (the Buy drawer's pattern, minus the fee clause on ACH);
//   - the drawer's header follows the Web DS SheetHeader these slides use
//     (24 from the top), which sits 8 lower than the Buy and Auto-buy
//     drawers' embedded header.
import * as React from "react";
import { Persona } from "@/lib/persona";
import { Accounts } from "@/lib/accounts";
import { FlowStore } from "@/lib/flow-store";
import { SideDrawer } from "@/components/side-drawer";
import { WebDsV2 } from "@/components/web-ds-v2";

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
const ACCOUNT_TYPE_LABEL = { checking: "Checking", savings: "Savings" };

/** "WD-7K2F-9Q4X": a reference made up in the browser for the demo. */
function newReference() {
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const pick = () => A[Math.floor(Math.random() * A.length)];
  return `WD-${Array.from({ length: 4 }, pick).join("")}-${Array.from({ length: 4 }, pick).join("")}`;
}

function Note({ children }) {
  return <p className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{children}</p>;
}

/** The Glint account's details, to fund the USD wallet from outside. */
function Deposit({ children }) {
  const a = Accounts.ALL.fiat;
  const holder = Persona.DEFAULT.company?.legalName ?? Persona.DEFAULT.business;
  return (
    <SideDrawer trigger={children}>
      <SideDrawer.Header
        inset="sheet"
        title="Deposit"
        description="Add money to your USD wallet from your business bank account."
      />
      <SideDrawer.Body>
        <div className="flex flex-col gap-4">
          <WebDsV2.Summary>
            <WebDsV2.DescriptionItem layout="stacked" label="Account holder" value={holder} />
            <WebDsV2.DescriptionItem layout="stacked" label="Routing number" value={a.routingNumber} copy={a.routingNumber} />
            <WebDsV2.DescriptionItem
              layout="stacked"
              label="Account number"
              value={Accounts.numberFull("fiat")}
              copy={Accounts.numberFull("fiat")}
            />
            <WebDsV2.DescriptionItem layout="stacked" label="Account type" value={a.type} />
          </WebDsV2.Summary>
          <Note>Send a domestic wire or ACH to these details to fund your USD wallet.</Note>
        </div>
      </SideDrawer.Body>
    </SideDrawer>
  );
}

const EMPTY = {
  amount: "",
  rail: "ach",
  holder: "",
  bankName: "",
  routing: "",
  accountType: "checking",
  account: "",
  confirm: "",
  reference: "",
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
    bank: f.rail === "wire" && !f.bankName.trim(),
    routing: digits(f.routing).length !== 9,
    account: digits(f.account).length < 4,
    confirm: digits(f.account) !== digits(f.confirm) || !f.confirm,
  };
  const FIELD_ID = {
    amount: "withdraw-amount",
    holder: "withdraw-holder",
    bank: "withdraw-bank",
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
        bankName: f.rail === "wire" ? f.bankName.trim() : "",
        routingNumber: digits(f.routing),
        accountLast4: digits(f.account).slice(-4),
        accountType: f.rail === "ach" ? f.accountType : "",
        reference: f.reference.trim(),
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
        <WebDsV2.DescriptionItem layout="stacked" label="Send by" value={`${r.label}, ${r.cost}`} />
        <WebDsV2.DescriptionItem
          layout="stacked"
          label="To"
          value={`${done.recipient.holder}, account ending ${done.recipient.accountLast4}`}
        />
        <WebDsV2.DescriptionItem layout="stacked" label="Arrives" value={r.arrives} />
      </WebDsV2.Summary>
    );
    footer = (
      <>
        <Note>Quote your reference ID if you contact us about this withdrawal.</Note>
        <WebDsV2.Button size="xl" className="w-full" onClick={() => close(false)}>
          Done
        </WebDsV2.Button>
      </>
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
          <WebDsV2.DescriptionItem
            label={f.rail === "wire" ? "Wire fee" : "Fee"}
            value={rail.fee ? Persona.fmtMoney(rail.fee) : "Free"}
          />
          <WebDsV2.Divider />
          <WebDsV2.DescriptionItem label="Total from USD wallet" value={Persona.fmtMoney(total)} emphasis="total" />
        </WebDsV2.Summary>
        <span className="text-xs leading-4 text-[color:var(--wds-muted-foreground)]">{rail.arrivesNote}</span>
        <span className="text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">Sending to</span>
        <WebDsV2.Summary>
          <WebDsV2.DescriptionItem label="Account holder" value={f.holder.trim()} />
          <WebDsV2.DescriptionItem
            label={f.rail === "wire" ? "Wire routing number" : "Routing number"}
            value={digits(f.routing)}
          />
          <WebDsV2.DescriptionItem label="Account number" value={digits(f.account)} />
          {f.rail === "wire" ? (
            <>
              <WebDsV2.DescriptionItem label="Bank name" value={f.bankName.trim()} />
              {f.reference.trim() ? <WebDsV2.DescriptionItem label="Reference" value={f.reference.trim()} /> : null}
            </>
          ) : (
            <WebDsV2.DescriptionItem label="Account type" value={ACCOUNT_TYPE_LABEL[f.accountType]} />
          )}
        </WebDsV2.Summary>
        {f.rail === "wire" ? (
          <WebDsV2.Alert tone="warning" title="Wires can’t be reversed">
            Check the bank details carefully. Once a wire is sent, we can’t get the money back.
          </WebDsV2.Alert>
        ) : null}
      </div>
    );
    footer = (
      <>
        <Note>Our team checks and approves every withdrawal before it’s sent.</Note>
        <WebDsV2.Button size="xl" className="w-full" onClick={confirm}>
          {rail.confirm}
        </WebDsV2.Button>
      </>
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
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">Send by</span>
          <WebDsV2.Segmented
            aria-label="Send by"
            stretch
            value={f.rail}
            onValueChange={(v) => setF((x) => ({ ...x, rail: v }))}
            options={[
              { value: "ach", label: RAIL.ach.label },
              { value: "wire", label: RAIL.wire.label },
            ]}
          />
          <span className="pt-2 text-xs leading-4 text-[color:var(--wds-muted-foreground)]">{rail.helper}</span>
        </div>
        <WebDsV2.Field label="Account holder name" htmlFor="withdraw-holder" helper="Must match your business name">
          <WebDsV2.Input id="withdraw-holder" size="default" invalid={bad("holder")} autoComplete="off" placeholder="Business name" value={f.holder} onChange={set("holder")} />
        </WebDsV2.Field>
        {f.rail === "wire" ? (
          <>
            <WebDsV2.Field label="Bank name" htmlFor="withdraw-bank">
              <WebDsV2.Input id="withdraw-bank" size="default" invalid={bad("bank")} autoComplete="off" placeholder="Bank name" value={f.bankName} onChange={set("bankName")} />
            </WebDsV2.Field>
            <WebDsV2.Field
              label="Wire routing number"
              htmlFor="withdraw-routing"
              helper="Check with your bank, this can differ from your ACH routing number."
            >
              <WebDsV2.Input id="withdraw-routing" size="default" invalid={bad("routing")} inputMode="numeric" autoComplete="off" placeholder="9 digits" value={f.routing} onChange={set("routing")} />
            </WebDsV2.Field>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <WebDsV2.Field label="Routing number" htmlFor="withdraw-routing">
              <WebDsV2.Input id="withdraw-routing" size="default" invalid={bad("routing")} inputMode="numeric" autoComplete="off" placeholder="9 digits" value={f.routing} onChange={set("routing")} />
            </WebDsV2.Field>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">Account type</span>
              <WebDsV2.Segmented
                aria-label="Account type"
                stretch
                value={f.accountType}
                onValueChange={(v) => setF((x) => ({ ...x, accountType: v }))}
                options={[
                  { value: "checking", label: ACCOUNT_TYPE_LABEL.checking },
                  { value: "savings", label: ACCOUNT_TYPE_LABEL.savings },
                ]}
              />
            </div>
          </div>
        )}
        <WebDsV2.Field label="Account number" htmlFor="withdraw-account">
          <WebDsV2.Input id="withdraw-account" size="default" invalid={bad("account")} inputMode="numeric" autoComplete="off" placeholder="Account number" value={f.account} onChange={set("account")} />
        </WebDsV2.Field>
        <WebDsV2.Field label="Confirm account number" htmlFor="withdraw-confirm">
          <WebDsV2.Input id="withdraw-confirm" size="default" invalid={bad("confirm")} inputMode="numeric" autoComplete="off" placeholder="Re-enter account number" value={f.confirm} onChange={set("confirm")} />
        </WebDsV2.Field>
        {f.rail === "wire" ? (
          <WebDsV2.Field label="Reference (optional)" htmlFor="withdraw-reference">
            <WebDsV2.Input id="withdraw-reference" size="default" autoComplete="off" placeholder="For example, an invoice number" value={f.reference} onChange={set("reference")} />
          </WebDsV2.Field>
        ) : null}
      </div>
    );
    footer = (
      <>
        <Note>We don’t save bank details, so you’ll enter them each time.</Note>
        <WebDsV2.Button size="xl" className="w-full" onClick={toReview}>
          {rail.review}
        </WebDsV2.Button>
      </>
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
