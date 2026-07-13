// Blocks/DataTable/DataTableColumnHeader — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-datatable-datatablecolumnheader--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    docs: {
      description: {
        story: "Table with sortable column headers. Click a header to cycle through ascending, descending, and unsorted states."
      },
      source: {
        code: `const columns: ColumnDef<MyData>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Name"
        dataHook="header-name"
        align="left"
      />
    ),
  },
  {
    accessorKey: "count",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Count"
        dataHook="header-count"
        align="right"
      />
    ),
    cell: ({ row }) => (
      <div className="text-right">{row.getValue("count")}</div>
    ),
  },
];`
      }
    },
    variants: [{
      storyDescription: "Default"
    }]
  },
  render: () => <ColumnHeaderDemo dataHook="column-header-demo" />,
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test sortable headers render with icons", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (variant) {
        const headers = variant.querySelectorAll('[data-slot="data-table-column-header"]');
        expect(headers.length).toBe(3);

        // Each sortable header has a button
        const buttons = variant.querySelectorAll('[data-slot="data-table-column-header"] button');
        expect(buttons.length).toBe(3);
      }
    });
  }
}
