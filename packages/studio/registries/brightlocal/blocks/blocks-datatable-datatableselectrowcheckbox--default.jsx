// Blocks/DataTable/DataTableSelectRowCheckbox — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-datatable-datatableselectrowcheckbox--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    docs: {
      description: {
        story: "Table with per-row checkboxes. Click individual checkboxes to select rows. The header checkbox reflects the aggregate state."
      },
      source: {
        code: `{
  id: "select",
  header: ({ table }) => (
    <DataTableSelectAllCheckbox table={table} dataHook="select-all" />
  ),
  cell: ({ row }) => (
    <DataTableSelectRowCheckbox row={row} dataHook={\`select-\${row.id}\`} />
  ),
  enableSorting: false,
}`
      }
    },
    variants: [{
      storyDescription: "Default"
    }]
  },
  render: () => <RowCheckboxDemo dataHook="row-checkbox-demo" />,
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test row checkboxes render", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (variant) {
        const rowCheckboxes = variant.querySelectorAll('[role="checkbox"][aria-label="Select row"]');
        expect(rowCheckboxes.length).toBe(4);

        // All unchecked by default
        for (const cb of rowCheckboxes) {
          expect(cb).toHaveAttribute("data-state", "unchecked");
        }
      }
    });
  }
}
