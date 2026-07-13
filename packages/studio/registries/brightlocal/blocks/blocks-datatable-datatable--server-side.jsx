// Blocks/DataTable/DataTable — Server Side
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-datatable-datatable--server-side
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  parameters: {
    docs: {
      description: {
        story: "Server-side table with `manualSorting` and `manualFiltering` enabled. Shows loading skeletons while the async fetch resolves, then renders the server response."
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
  manualFiltering: true,
  enableSorting: true,
});

<DataTable table={table} dataHook="server-table" isLoading={isLoading} />`
      }
    },
    variants: [{
      storyDescription: "Server-side"
    }]
  },
  render: () => <ServerViewDemo dataHook="server-table-view" />,
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test server-side view renders", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (variant) {
        const view = variant.querySelector('[data-slot="data-table-view"]');
        expect(view).toBeInTheDocument();
        expect(view).toHaveAttribute("data-hook", "server-table-view");
      }
    });
  }
}
