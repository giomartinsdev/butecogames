import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Pagination } from "./Pagination.js";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  /** Enable client-side pagination with this page size */
  pageSize?: number;
  /** Server-side pagination state */
  pagination?: { page: number; pages: number; total: number };
  /** Callback for server-side page changes */
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<TData>({
  columns,
  data,
  pageSize,
  pagination: serverPagination,
  onPageChange,
  isLoading,
  emptyMessage = "Nenhum dado encontrado",
}: DataTableProps<TData>) {
  const isClientPagination = !!pageSize && !serverPagination;
  const [clientPage, setClientPage] = useState(0);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(isClientPagination
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          state: { pagination: { pageIndex: clientPage, pageSize } },
          onPaginationChange: (updater) => {
            const next =
              typeof updater === "function"
                ? updater({ pageIndex: clientPage, pageSize })
                : updater;
            setClientPage(next.pageIndex);
          },
        }
      : {}),
  });

  const rows = table.getRowModel().rows;
  const clientPageCount = isClientPagination ? table.getPageCount() : 0;

  return (
    <div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2 text-left text-muted-foreground font-medium"
                    style={header.column.columnDef.meta as any}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Carregando...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-2"
                      style={cell.column.columnDef.meta as any}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Client-side pagination */}
      {isClientPagination && clientPageCount > 1 && (
        <Pagination
          page={clientPage + 1}
          pageCount={clientPageCount}
          onPageChange={(p) => setClientPage(p - 1)}
        />
      )}

      {/* Server-side pagination */}
      {serverPagination && onPageChange && (
        <Pagination
          page={serverPagination.page}
          pageCount={serverPagination.pages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
