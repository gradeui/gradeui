// Blocks/DataTable/DataTableSearch — Server Side
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-datatable-datatablesearch--server-side
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    docs: {
      description: {
        story: "Server-side global filter with `manualFiltering` enabled. The search value is passed to the server via `onGlobalFilterChange` instead of filtering client-side rows."
      },
      source: {
        code: `const [globalFilter, setGlobalFilter] = useState("");

const table = useDataTable({
  columns,
  data: serverData,
  enableGlobalFiltering: true,
  manualFiltering: true,
  globalFilter,
  onGlobalFilterChange: (next) => {
    setGlobalFilter(next);
    // trigger server fetch with search query
  },
});

<DataTableSearch
  table={table}
  dataHook="search"
  placeholder="Search (server)..."
/>`
      }
    },
    variants: [{
      storyDescription: "Server-side"
    }]
  },
  render: () => <ServerSearchDemo dataHook="server-search-demo" />,
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test server-side search renders", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (variant) {
        const search = variant.querySelector('[data-hook="server-search-demo"]');
        expect(search).toBeInTheDocument();
        const input = variant.querySelector("input");
        expect(input).toBeInTheDocument();
      }
    });
  }
}
