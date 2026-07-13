// Blocks/DataTable/DataTableSelectRowCheckbox — Server Side
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-datatable-datatableselectrowcheckbox--server-side
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    docs: {
      description: {
        story: "Controlled row selection with `getRowId`, `rowSelection`, and `onRowSelectionChange`. Selection state is keyed by stable server IDs so it persists across page changes."
      },
      source: {
        code: `const [selection, setSelection] = useState({});

const table = useDataTable({
  columns,
  data: serverData,
  enableRowSelection: true,
  getRowId: (row) => row.id,
  rowSelection: selection,
  onRowSelectionChange: (next) => {
    setSelection(next);
    // sync selection with server
  },
});`
      }
    },
    variants: [{
      storyDescription: "Server-side"
    }]
  },
  render: () => <ServerRowCheckboxDemo dataHook="server-row-checkbox" />,
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test server-side row checkboxes render", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (variant) {
        const rowCheckboxes = variant.querySelectorAll('[role="checkbox"][aria-label="Select row"]');
        expect(rowCheckboxes.length).toBe(4);
      }
    });
  }
}
