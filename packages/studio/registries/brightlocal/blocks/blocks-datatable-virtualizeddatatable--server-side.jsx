// Blocks/DataTable/VirtualizedDataTable — Server Side
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-datatable-virtualizeddatatable--server-side
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    docs: {
      description: {
        story: "Server-side virtualized table with `manualSorting` enabled. Shows loading skeletons during the initial fetch, then renders 2 000 rows in a virtual scroll container."
      },
      source: {
        code: `const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  fetchData().then((rows) => {
    setData(rows);
    setIsLoading(false);
  });
}, []);

const table = useDataTable({
  columns,
  data,
  manualSorting: true,
  enableSorting: true,
});

<VirtualizedDataTable
  table={table}
  dataHook="server-virtual-table"
  height={400}
  isLoading={isLoading}
/>`
      }
    },
    variants: [{
      storyDescription: "Server-side"
    }]
  },
  render: () => <ServerVirtualizedDemo dataHook="server-virtualized-view" />,
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test server-side virtualized view renders", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (variant) {
        const view = variant.querySelector('[data-slot="data-table-view"]');
        expect(view).toBeInTheDocument();
        expect(view).toHaveAttribute("data-hook", "server-virtualized-view");
      }
    });
  }
}
