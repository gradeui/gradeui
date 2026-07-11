---
name: Pagination
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/pagination"
subcomponents: [PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis]
props:
  - page? — TODO(review): type + one-line description from src
  - totalPages? — TODO(review): type + one-line description from src
  - siblingCount? — TODO(review): type + one-line description from src
  - boundaryCount? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
---

Page navigation controls with previous/next and page number links.

## Guidance

Pagination provides navigation controls for paginated content. Custom implementation using Tailwind CSS.

### When to Use
- Table data with multiple pages
- Search results with pagination
- Long lists split across pages

### Features
- Circular button design matching Figma specs
- usePagination hook for logic with ellipsis support
- Previous/Next navigation buttons
- Active page indication with aria-current
- Accessible with ARIA labels

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "pagination") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
