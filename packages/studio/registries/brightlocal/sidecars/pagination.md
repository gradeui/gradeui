---
name: Pagination
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/pagination"
subcomponents: [PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - ariaLabel?: string — Accessible label for the pagination navigation (for unique landmark identification). (default "Pagination")
  - isActive?: boolean — PaginationButton: Whether this page is the current page
  - page: number — PaginationLink: Page number to display
  - disabled?: boolean — PaginationPrevious: Whether the previous button is disabled (on first page)
  - srLabel?: string — PaginationEllipsis: Screen-reader-only label for the ellipsis. (default "More) pages"
---

```jsx
const items = usePagination({ page: 5, totalPages: 10 });

<Pagination dataHook="pagination">
  <PaginationContent>
    {items.map((item, index) => (
      <PaginationItem key={index}>
        {item === "previous" && <PaginationPrevious />}
        {item === "next" && <PaginationNext />}
        {item === "ellipsis" && <PaginationEllipsis />}
        {typeof item === "number" && <PaginationLink page={item} />}
      </PaginationItem>
    ))}
  </PaginationContent>
</Pagination>
```
```jsx
<Pagination ariaLabel={t("pagination.nav")} dataHook="pagination">
  <PaginationContent>
    <PaginationPrevious ariaLabel={t("pagination.prev")} />
    <PaginationLink page={3} ariaLabel={t("pagination.goTo", { page: 3 })} />
    <PaginationEllipsis srLabel={t("pagination.more")} />
    <PaginationNext ariaLabel={t("pagination.next")} />
  </PaginationContent>
</Pagination>
```
```jsx
const [page, setPage] = React.useState(5);
const totalPages = 10;
const items = usePagination({
  page,
  totalPages,
  siblingCount: 1,
  boundaryCount: 1,
});

<Pagination dataHook="default-pagination">
  <PaginationContent>
    {items.map((item, index) => {
      if (item === "previous") {
        return (
          <PaginationItem key={index}>
            <PaginationPrevious
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            />
          </PaginationItem>
        );
      }
      if (item === "next") {
        return (
          <PaginationItem key={index}>
            <PaginationNext
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </PaginationItem>
        );
      }
      if (item === "ellipsis") {
        return (
          <PaginationItem key={index}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      return (
        <PaginationItem key={index}>
          <PaginationLink
            page={item}
            isActive={page === item}
            onClick={() => setPage(item)}
         
/* …truncated */
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-pagination--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
