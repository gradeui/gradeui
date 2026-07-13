// Blocks/DataTable/VirtualizedDataTable — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-datatable-virtualizeddatatable--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    docs: {
      description: {
        story: "Virtualized table rendering 2 000 rows in a 400 px scroll container. Only visible rows are in the DOM."
      },
      source: {
        code: `const table = useDataTable({
  columns,
  data, // 2 000 rows
  enableSorting: true,
});

<VirtualizedDataTable
  table={table}
  dataHook="virtual-table"
  height={400}
/>`
      }
    },
    variants: [{
      storyDescription: "Default"
    }]
  },
  render: () => <VirtualizedDemo dataHook="virtualized-view" />,
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test virtualized view renders table", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (variant) {
        const view = variant.querySelector('[data-slot="data-table-view"]');
        expect(view).toBeInTheDocument();
        expect(view).toHaveAttribute("data-hook", "virtualized-view");

        // Has table
        const table = variant.querySelector("table");
        expect(table).toBeInTheDocument();

        // Only a subset of rows should be in the DOM (virtualized)
        const bodyRows = variant.querySelectorAll("tbody tr");
        expect(bodyRows.length).toBeGreaterThan(0);
        expect(bodyRows.length).toBeLessThan(100);
      }
    });
  }
}
