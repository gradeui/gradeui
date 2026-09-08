# Review Manager

The inbox: every review for this location as a data table, with status
tabs (all, needs action, manually replied, auto-replied, skipped),
faceted filters, and a reply panel.

## Capability model

Not every source can be replied to. `canReply` is Google and Facebook
only; `canAutoReply` is Google only; `ratingKind` is star or
recommendation, which is why auto-reply rules only offer star buckets.
The same map lives in Reply Templates; keep them in sync.

## Decisions carried from the UX audit

- Edit and delete of a sent reply are in.
- "Reply skipped" is the proposed status.
- Read and unread was deliberately dropped.
- Bulk select is parked.


## Reference: the website page beside this one

The Reputation Manager page. What we borrowed: "Reply to every review from a single, easy-to-use dashboard", and Google plus Facebook as the two sites you can answer from inside BrightLocal.

![brightlocal.com, full height, 10 Sep 2026](/reference/02-reputation-manager.png)
