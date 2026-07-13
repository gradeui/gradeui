// Blocks/DataTable/DataTableColumnHeader — Server Side
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-datatable-datatablecolumnheader--server-side
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    docs: {
      description: {
        story: "Column headers with `manualSorting` enabled. Clicking a header updates the sort state but does **not** reorder client-side rows — the consumer uses the sort state to drive a server query."
      },
      source: {
        code: `const [sorting, setSorting] = useState([]);

const table = useDataTable({
  columns,
  data: serverData,
  enableSorting: true,
  manualSorting: true,
  sorting,
  onSortingChange: (next) => {
    setSorting(next);
    // trigger server fetch with new sort params
  },
});`
      }
    },
    variants: [{
      storyDescription: "Server-side"
    }]
  },
  render: () => <ServerColumnHeaderDemo dataHook="server-column-header" />,
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test server-side headers render with sort buttons", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (variant) {
        const headers = variant.querySelectorAll('[data-slot="data-table-column-header"]');
        expect(headers.length).toBe(3);
        const buttons = variant.querySelectorAll('[data-slot="data-table-column-header"] button');
        expect(buttons.length).toBe(3);
      }
    });
  }
}
