import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  SortingState,
  VisibilityState,
  RowData,
} from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'center' | 'right';
  }
}

import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Settings2, Inbox } from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  manualPagination?: boolean;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  globalFilterPlaceholder?: string;
  bulkActions?: (selectedRows: TData[], clearSelection: () => void) => React.ReactNode;
}

import { useDebounce } from '@/shared/hooks/useDebounce';
import { useEffect } from 'react';

const ReusableDataTableImpl = memo(function ReusableDataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  manualPagination = false,
  onRowClick,
  isLoading = false,
  globalFilterPlaceholder,
  bulkActions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [searchInput, setSearchInput] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');

  const debouncedSearch = useDebounce(searchInput, 250);

  useEffect(() => {
    setGlobalFilter(debouncedSearch);
  }, [debouncedSearch]);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination,
    manualSorting: manualPagination,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(r => r.original);
  const clearSelection = () => setRowSelection({});

  return (
    <div className="space-y-4 relative w-full max-w-full min-w-0 overflow-hidden">
      {/* Toolbar: Global Search, Column Visibility & Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full">
          {globalFilterPlaceholder && (
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={globalFilterPlaceholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          )}
          
          {selectedRows.length > 0 && bulkActions && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg animate-in fade-in zoom-in-95 duration-200">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-r border-emerald-200 dark:border-emerald-800 pr-3 mr-1">
                Đã chọn {selectedRows.length}
              </span>
              {bulkActions(selectedRows, clearSelection)}
            </div>
          )}
        </div>

        {/* Column Visibility Dropdown */}
        <div className="relative group shrink-0">
          <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Cột hiển thị</span>
          </button>
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
                .map((column) => {
                  return (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="truncate">{typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}</span>
                    </label>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Đang tải dữ liệu...</span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, idx) => {
                    const align = header.column.columnDef.meta?.align || 'left';
                    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
                    const isFirstColumn = idx === 0;
                    const isLastColumn = idx === headerGroup.headers.length - 1;
                    const stickyClass = isFirstColumn ? 'sticky left-0 z-10 bg-gray-50 dark:bg-gray-900/50' : isLastColumn ? 'sticky right-0 z-10 bg-gray-50 dark:bg-gray-900/50' : '';
                    
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className={`px-4 py-3 font-medium tracking-wider whitespace-nowrap ${alignClass} ${stickyClass}`}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : 'auto' }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? `cursor-pointer select-none flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`
                                : `flex items-center gap-2 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`,
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <ChevronUp className="w-4 h-4 text-primary" />,
                              desc: <ChevronDown className="w-4 h-4 text-primary" />,
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading && data.length === 0 ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    {columns.map((_, colIdx) => (
                      <td key={colIdx} className="px-4 py-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => onRowClick && onRowClick(row.original)}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors data-[state=selected]:bg-primary/5 dark:data-[state=selected]:bg-primary/10 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {row.getVisibleCells().map((cell, idx) => {
                      const align = cell.column.columnDef.meta?.align || 'left';
                      const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
                      const isFirstColumn = idx === 0;
                      const isLastColumn = idx === row.getVisibleCells().length - 1;
                      const stickyClass = isFirstColumn ? 'sticky left-0 z-10 bg-white dark:bg-gray-800' : isLastColumn ? 'sticky right-0 z-10 bg-white dark:bg-gray-800' : '';
                      
                      return (
                        <td key={cell.id} className={`px-4 py-3 text-gray-900 dark:text-gray-100 whitespace-nowrap ${alignClass} ${stickyClass}`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Không có dữ liệu</p>
                        <p className="text-xs mt-1">Vui lòng điều chỉnh bộ lọc hoặc thêm mới.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-gray-500 dark:text-gray-400">
          Đã chọn {Object.keys(rowSelection).length} / {table.getPreFilteredRowModel().rows.length} dòng.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">Số dòng / trang</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-2 py-1 text-sm focus:border-primary focus:ring-primary dark:bg-gray-800"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
            Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              title="Trang đầu"
              className="hidden h-8 w-8 items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-transparent p-0 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 lg:flex transition-colors"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              title="Trang trước"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-transparent p-0 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              title="Trang sau"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-transparent p-0 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              title="Trang cuối"
              className="hidden h-8 w-8 items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-transparent p-0 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 lg:flex transition-colors"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export const ReusableDataTable = ReusableDataTableImpl as <TData, TValue = any>(
  props: DataTableProps<TData, TValue>
) => React.ReactElement;
