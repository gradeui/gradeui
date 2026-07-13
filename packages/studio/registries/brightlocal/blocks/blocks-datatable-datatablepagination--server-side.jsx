// Blocks/DataTable/DataTablePagination — Server Side
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-datatable-datatablepagination--server-side
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    docs: {
      description: {
        story: "Server-side pagination using controlled `pagination` / `onPaginationChange` on the hook. The table instance holds no client rows — the server owns the data."
      },
      source: {
        code: `const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0,
  pageSize: 25,
});

const table = useDataTable({
  columns,
  data: [],
  enablePagination: true,
  manualPagination: true,
  rowCount: 1200,
  pagination,
  onPaginationChange: setPagination,
});

<DataTablePagination table={table} dataHook="pagination" />`
      }
    },
    singleColumn: true,
    variants: [{
      storyDescription: "Server-side pagination",
      ariaLabel: "Server pagination"
    }, {
      showRowCount: false,
      storyDescription: "Without row count",
      ariaLabel: "Server compact pagination"
    }]
  },
  args: {
    dataHook: "pagination-server",
    showRowCount: true
  },
  render: args => <ServerPaginationDemo ariaLabel={args.ariaLabel as string} dataHook={args.dataHook as string} pageSize={25} totalRows={1200} showRowCount={args.showRowCount as boolean} />,
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test server-side pagination renders", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (variant) {
        const pagination = variant.querySelector('[data-slot="data-table-pagination"]');
        expect(pagination).toBeInTheDocument();
        expect(pagination).toHaveAttribute("data-hook", "pagination-server");
        const nav = variant.querySelector("nav");
        expect(nav).toBeInTheDocument();
      }
    });
    await step("Test row count text is hidden", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      if (variant) {
        const pagination = variant.querySelector('[data-slot="data-table-pagination"]');
        expect(pagination).toBeInTheDocument();
        const rowCountText = pagination?.querySelector("span.text-muted-foreground");
        expect(rowCountText).not.toBeInTheDocument();
        const nav = variant.querySelector("nav");
        expect(nav).toBeInTheDocument();
      }
    });
  }
}
