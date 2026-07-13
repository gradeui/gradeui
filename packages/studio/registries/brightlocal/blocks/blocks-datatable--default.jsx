// Blocks/DataTable — Default
// Harvested from https://storybook.brightlocal.com/?path=/story/blocks-datatable--default
// (parameters.docs.source.originalSource — story-file-local helper
// components are NOT included; they live in BrightLocal's repo.)

{
  args: {
    dataHook: "data-table-default",
    columns: projectColumns as ColumnDef<unknown, unknown>[],
    data: projectData,
    enableSorting: true,
    enableGlobalFiltering: true,
    enableRowSelection: true,
    enablePagination: true,
    pageSize: 5
  },
  parameters: {
    singleColumn: true,
    docs: {
      description: {
        story: "A full-featured DataTable with sorting, filtering, row selection, and pagination. Demonstrates the composition model: `useDataTable` + `DataTable` + `DataTablePagination`."
      }
    },
    variants: [{
      storyDescription: "Default"
    }, {
      storyDescription: "Cell Types",
      dataHook: "data-table-cell-types",
      columns: cellTypesColumns as ColumnDef<unknown, unknown>[],
      data: cellTypesData,
      enableGlobalFiltering: false,
      enableRowSelection: false,
      enablePagination: false
    }, {
      storyDescription: "Loading State",
      dataHook: "data-table-loading",
      columns: projectColumns as ColumnDef<unknown, unknown>[],
      data: [],
      isLoading: true,
      pageSize: 5
    }, {
      storyDescription: "Empty Table",
      dataHook: "data-table-empty",
      columns: projectColumns as ColumnDef<unknown, unknown>[],
      data: [],
      enablePagination: false,
      enableRowSelection: false,
      noResultsMessage: "No results."
    }, {
      storyDescription: "Sticky Header",
      dataHook: "data-table-sticky",
      columns: projectColumns as ColumnDef<unknown, unknown>[],
      data: projectData,
      enableSorting: true,
      enablePagination: false,
      enableRowSelection: false,
      stickyHeader: true
    }, {
      storyDescription: "Expandable Rows",
      dataHook: "data-table-expandable",
      columns: treeColumns as ColumnDef<unknown, unknown>[],
      data: treeData,
      enableExpanding: true,
      getSubRows: (row: unknown) => (row as TreeRow).children,
      getRowId: (row: unknown) => (row as TreeRow).id,
      enablePagination: false,
      enableRowSelection: false
    }, {
      storyDescription: "Sorting Disabled",
      dataHook: "data-table-no-sorting",
      columns: projectColumns as ColumnDef<unknown, unknown>[],
      data: projectData,
      enableSorting: false,
      enablePagination: false,
      enableRowSelection: false
    }, {
      storyDescription: "Custom labels (i18n)",
      dataHook: "data-table-i18n",
      columns: projectColumns as ColumnDef<unknown, unknown>[],
      data: [],
      enablePagination: false,
      enableRowSelection: false,
      noResultsMessage: "No se encontraron resultados."
    }],
    a11y: {
      config: {
        rules: [{
          // Radix UI Popover/DropdownMenu sets aria-controls on trigger before the content exists in DOM
          // This is a known issue: https://github.com/radix-ui/primitives/issues/3013
          id: "aria-valid-attr-value",
          enabled: false
        }, {
          // False positive: axe cannot determine background color due to table row borders/layers
          // The actual contrast is correct (text-foreground on bg-background)
          id: "color-contrast",
          enabled: false
        }]
      }
    }
  },
  render: args => {
    // Simple variants (no toolbar) use inline hook + view.
    const isCellTypesVariant = !args.enablePagination && !args.enableRowSelection;
    const isLoadingVariant = args.isLoading;
    if (isCellTypesVariant || isLoadingVariant) {
      return <SimpleDemo {...args} />;
    }

    // Full-featured variant with status filter, search, and pagination.
    return <DefaultVariantDemo pageSize={args.pageSize} />;
  },
  play: async ({
    canvasElement,
    step,
    parameters
  }) => {
    if (!isMultiViewMode(canvasElement)) return;
    const variants = parameters.variants || [];
    await step("Test Default variant - table with toolbar and pagination", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;

      // Verify table exists
      const table = variant.querySelector('[data-slot="table"]');
      await expect(table).toBeInTheDocument();

      // Verify toolbar area exists
      const toolbar = variant.querySelector('[data-hook="toolbar"]');
      await expect(toolbar).toBeInTheDocument();

      // Verify search input exists
      const searchInput = variant.querySelector('[data-hook="toolbar-search"]');
      await expect(searchInput).toBeInTheDocument();

      // Verify pagination exists (both top and bottom instances)
      const paginations = variant.querySelectorAll('[data-slot="data-table-pagination"]');
      await expect(paginations.length).toBeGreaterThan(0);

      // Verify select-all checkbox exists
      const selectAll = variant.querySelector('[data-hook="select-all"]');
      await expect(selectAll).toBeInTheDocument();

      // Verify sortable header exists
      const nameHeader = variant.querySelector('[data-hook="header-name"]');
      await expect(nameHeader).toBeInTheDocument();

      // Verify data-type-specific columns exist
      const leadHeader = variant.querySelector('[data-hook="header-lead"]');
      await expect(leadHeader).toBeInTheDocument();
      const tagsHeader = variant.querySelector('[data-hook="header-tags"]');
      await expect(tagsHeader).toBeInTheDocument();
      const budgetHeader = variant.querySelector('[data-hook="header-budget"]');
      await expect(budgetHeader).toBeInTheDocument();
    });
    await step("Test Cell Types variant - table with various cell components", async () => {
      const variant = getVariant(canvasElement, variants, 1);
      if (!variant) return;

      // Verify table exists
      const table = variant.querySelector('[data-slot="table"]');
      await expect(table).toBeInTheDocument();

      // Verify cell type components exist (Badge, Switch, Avatar, Progress, etc.)
      const badge = variant.querySelector('[data-hook="badge-1"]');
      await expect(badge).toBeInTheDocument();
      const switchEl = variant.querySelector('[data-hook="switch-1"]');
      await expect(switchEl).toBeInTheDocument();
      const avatar = variant.querySelector('[data-hook="avatar-1"]');
      await expect(avatar).toBeInTheDocument();
      const progress = variant.querySelector('[data-hook="progress-1"]');
      await expect(progress).toBeInTheDocument();
    });
    await step("Test Loading State variant - skeleton rows displayed", async () => {
      const variant = getVariant(canvasElement, variants, 2);
      if (!variant) return;

      // Verify table exists
      const table = variant.querySelector('[data-slot="table"]');
      await expect(table).toBeInTheDocument();

      // Verify skeleton rows are displayed (should have multiple skeleton elements)
      const skeletons = variant.querySelectorAll('[data-slot="skeleton"]');
      await expect(skeletons.length).toBeGreaterThan(0);
    });
    await step("Test Empty Table variant - no-results message displayed", async () => {
      const variant = getVariant(canvasElement, variants, 3);
      if (!variant) return;

      // Table should exist
      const table = variant.querySelector('[data-slot="table"]');
      await expect(table).toBeInTheDocument();

      // Only the empty state row should be present
      const dataRows = variant.querySelectorAll("tbody tr");
      await expect(dataRows.length).toBe(1);

      // The empty state message should be in an aria-live region
      const statusRegion = variant.querySelector('[role="status"]');
      await expect(statusRegion).toBeInTheDocument();
      await expect(statusRegion).toHaveAttribute("aria-live", "polite");
    });
    await step("Test Sticky Header variant - thead has sticky positioning", async () => {
      const variant = getVariant(canvasElement, variants, 4);
      if (!variant) return;

      // Verify table exists
      const table = variant.querySelector('[data-slot="table"]');
      await expect(table).toBeInTheDocument();

      // Verify thead has sticky CSS classes
      const thead = variant.querySelector("thead");
      await expect(thead).toBeInTheDocument();
      await expect(thead).toHaveClass("sticky");
      await expect(thead).toHaveClass("top-0");
      await expect(thead).toHaveClass("z-10");

      // Verify table-container has bounded height for scrolling
      const tableContainer = variant.querySelector('[data-slot="table-container"]');
      await expect(tableContainer).toBeInTheDocument();

      // Verify data rows are rendered
      const rows = variant.querySelectorAll("tbody tr");
      await expect(rows.length).toBeGreaterThan(5);
    });
    await step("Test Expandable Rows variant - expand and collapse children", async () => {
      const variant = getVariant(canvasElement, variants, 5);
      if (!variant) return;

      // Verify table exists
      const table = variant.querySelector('[data-slot="table"]');
      await expect(table).toBeInTheDocument();

      // Initially only top-level rows visible (3 rows)
      const rowsBefore = variant.querySelectorAll("tbody tr");
      await expect(rowsBefore.length).toBe(3);

      // Find the expand button for the first group
      const expandButton = variant.querySelector('[data-hook="expand-group-1"]') as HTMLElement;
      await expect(expandButton).toBeInTheDocument();

      // Click to expand — should show parent + 2 children + other rows
      await userEvent.click(expandButton);
      await waitFor(() => {
        const rowsAfter = variant.querySelectorAll("tbody tr");
        expect(rowsAfter.length).toBe(5);
      });

      // Click again to collapse
      await userEvent.click(expandButton);
      await waitFor(() => {
        const rowsCollapsed = variant.querySelectorAll("tbody tr");
        expect(rowsCollapsed.length).toBe(3);
      });
    });

    // --- Behavioral tests for Default variant ---

    await step("Test sorting - clicking column header toggles sort and aria-sort", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const nameHeader = variant.querySelector('[data-hook="header-name"]') as HTMLElement;
      const headerCell = nameHeader.closest('[data-slot="table-head"]') as HTMLElement;

      // Click to sort ascending — aria-label on button + aria-sort on th
      await userEvent.click(nameHeader);
      await waitFor(() => {
        expect(nameHeader).toHaveAttribute("aria-label", expect.stringContaining("ascending"));
        expect(headerCell).toHaveAttribute("aria-sort", "ascending");
      });

      // Click again — should switch to descending
      await userEvent.click(nameHeader);
      await waitFor(() => {
        expect(nameHeader).toHaveAttribute("aria-label", expect.stringContaining("descending"));
        expect(headerCell).toHaveAttribute("aria-sort", "descending");
      });
    });
    await step("Test row selection - clicking checkbox selects a row", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const firstRowCheckbox = variant.querySelector('[data-slot="checkbox"][data-hook^="select-"]:not([data-hook="select-all"])') as HTMLElement;
      expect(firstRowCheckbox).toBeTruthy();

      // Click to select the row
      await userEvent.click(firstRowCheckbox);
      await waitFor(() => {
        expect(firstRowCheckbox).toHaveAttribute("data-state", "checked");
      });

      // Click again to deselect
      await userEvent.click(firstRowCheckbox);
      await waitFor(() => {
        expect(firstRowCheckbox).toHaveAttribute("data-state", "unchecked");
      });
    });
    await step("Test select all - clicking select-all checkbox selects all visible rows", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const selectAll = variant.querySelector('[data-hook="select-all"]') as HTMLElement;

      // Click select-all
      await userEvent.click(selectAll);
      await waitFor(() => {
        // All row checkboxes on the page should be checked
        const rowCheckboxes = variant.querySelectorAll('[data-slot="checkbox"][data-hook^="select-"]:not([data-hook="select-all"])');
        for (const checkbox of rowCheckboxes) {
          expect(checkbox).toHaveAttribute("data-state", "checked");
        }
      });

      // Deselect all
      await userEvent.click(selectAll);
      await waitFor(() => {
        const rowCheckboxes = variant.querySelectorAll('[data-slot="checkbox"][data-hook^="select-"]:not([data-hook="select-all"])');
        for (const checkbox of rowCheckboxes) {
          expect(checkbox).toHaveAttribute("data-state", "unchecked");
        }
      });
    });
    await step("Test search - global filter narrows results across all column types", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const searchInput = variant.querySelector('[data-hook="toolbar-search"] input') as HTMLInputElement;
      expect(searchInput).toBeTruthy();

      // Count rows before search (page size = 5)
      const rowsBefore = variant.querySelectorAll("tbody tr");
      const countBefore = rowsBefore.length;

      // Search by status (string enum) — "completed" matches status column
      await userEvent.click(searchInput);
      await userEvent.type(searchInput, "completed");
      await waitFor(() => {
        const filteredRows = variant.querySelectorAll("tbody tr");
        expect(filteredRows.length).toBeGreaterThan(0);
        expect(filteredRows.length).toBeLessThanOrEqual(countBefore);
      });

      // Clear and search by tag (array) — "DevOps" matches tags column
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, "DevOps");
      await waitFor(() => {
        const tagRows = variant.querySelectorAll("tbody tr");
        expect(tagRows.length).toBeGreaterThan(0);
      });

      // Clear and search with no-match query
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, "zzz-no-match-zzz");
      await waitFor(() => {
        const noRows = variant.querySelectorAll("tbody tr");
        // Should show "no results" row or fewer rows
        expect(noRows.length).toBeLessThanOrEqual(countBefore);
      });

      // Clear search to restore original state
      await userEvent.clear(searchInput);
    });
    await step("Test pagination - clicking next/prev advances the row range", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const pagination = variant.querySelector('[data-hook="data-table-default-pagination"]') as HTMLElement;
      if (!pagination) return;

      // Read the row-range label before paging
      const rangeLabel = pagination.querySelector("span.text-muted-foreground") as HTMLElement;
      const rangeBefore = rangeLabel?.textContent ?? "";
      const nextButton = pagination.querySelector('[aria-label="Go to next page"]') as HTMLElement;
      if (!nextButton) return;
      await userEvent.click(nextButton);
      await waitFor(() => {
        expect(rangeLabel?.textContent).not.toBe(rangeBefore);
      });

      // Page back to restore initial state for snapshot stability
      const prevButton = pagination.querySelector('[aria-label="Go to previous page"]') as HTMLElement;
      if (!prevButton) return;
      await userEvent.click(prevButton);
      await waitFor(() => {
        expect(rangeLabel?.textContent).toBe(rangeBefore);
      });
    });
    await step("Test selected row highlighting - selected rows get data-state", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const firstRowCheckbox = variant.querySelector('[data-slot="checkbox"][data-hook^="select-"]:not([data-hook="select-all"])') as HTMLElement;
      if (!firstRowCheckbox) return;

      // Select the row
      await userEvent.click(firstRowCheckbox);
      await waitFor(() => {
        const selectedRow = firstRowCheckbox.closest("tr");
        expect(selectedRow).toHaveAttribute("data-state", "selected");
      });

      // Deselect the row
      await userEvent.click(firstRowCheckbox);
      await waitFor(() => {
        const deselectedRow = firstRowCheckbox.closest("tr");
        expect(deselectedRow).not.toHaveAttribute("data-state", "selected");
      });
    });
    await step("Test default aria-labels render correctly", async () => {
      const variant = getVariant(canvasElement, variants, 0);
      if (!variant) return;
      const selectAll = variant.querySelector('[data-hook="select-all"]') as HTMLElement;
      if (selectAll) {
        await expect(selectAll).toHaveAttribute("aria-label", "Select all");
      }
      const searchInput = variant.querySelector("input[aria-label]") as HTMLInputElement;
      if (searchInput) {
        await expect(searchInput).toHaveAttribute("aria-label", "Search projects");
      }
    });
    await step("Test i18n - custom noResultsMessage (Spanish)", async () => {
      const variant = getVariant(canvasElement, variants, 7);
      if (!variant) return;
      const status = variant.querySelector('[role="status"]');
      if (status) {
        await expect(status).toHaveTextContent("No se encontraron resultados.");
      }
    });
  }
}
