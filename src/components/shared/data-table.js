"use client";

import { useMemo } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
} from "lucide-react";
import {
  flexRender,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const features = tableFeatures({});
const emptyRows = [];

export function DataTable({
  columns,
  rows,
  total,
  page,
  pageSize = 10,
  search,
  sortBy,
  sortDirection,
  onSearch,
  onSort,
  onPageChange,
  emptyMessage = "Aucun résultat.",
  isLoading = false,
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const tableColumns = useMemo(
    () =>
      columns.map((column) => ({
        id: column.key,
        header: column.label,
        accessorFn: (row) => row[column.key],
        cell: (context) =>
          column.render
            ? column.render(context.row.original)
            : (context.getValue() ?? "—"),
      })),
    [columns],
  );
  const table = useTable({
    features,
    columns: tableColumns,
    data: rows ?? emptyRows,
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <Input
          aria-label="Rechercher"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          className="ps-9"
          placeholder="Rechercher…"
        />
      </div>
      <div aria-busy={isLoading}>
        <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface sm:block">
          <Table className="min-w-max text-xs sm:text-sm">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    const column = columns.find((item) => item.key === header.id);
                    return (
                      <TableHead
                        key={header.id}
                        className="whitespace-nowrap px-2 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm"
                      >
                        {column?.sortable ? (
                          <button
                            type="button"
                            onClick={() => onSort(column.key)}
                            className="whitespace-nowrap font-semibold hover:text-primary"
                            aria-label={`Trier par ${column.label}`}
                            title={`Trier par ${column.label}`}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {sortBy === column.key &&
                              (sortDirection === "asc" ? (
                                <ArrowUp className="ms-1 inline size-3.5" aria-hidden="true" />
                              ) : (
                                <ArrowDown className="ms-1 inline size-3.5" aria-hidden="true" />
                              ))}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-28 text-center text-muted"
                  >
                    <span role="status" className="inline-flex items-center gap-2">
                      <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden="true" />
                      Chargement des données…
                    </span>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getAllCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="whitespace-nowrap px-2 py-2 text-xs sm:px-4 sm:py-4 sm:text-sm"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="space-y-2 sm:hidden">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface p-4 text-xs text-muted" role="status">
              <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden="true" />
              Chargement des données…
            </div>
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => {
              const cells = row.getAllCells();
              const primaryCell = cells.find((cell) => cell.column.id !== "actions");
              const actionCell = cells.find((cell) => cell.column.id === "actions");
              const detailCells = cells.filter(
                (cell) => cell !== primaryCell && cell !== actionCell,
              );
              const primaryColumn = columns.find(
                (column) => column.key === primaryCell?.column.id,
              );

              return (
                <article
                  key={row.id}
                  className="space-y-3 rounded-xl border border-line bg-surface p-3 text-xs"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    {primaryCell && (
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                          {primaryColumn?.label}
                        </p>
                        <div className="mt-1 break-words text-sm font-semibold">
                          {flexRender(
                            primaryCell.column.columnDef.cell,
                            primaryCell.getContext(),
                          )}
                        </div>
                      </div>
                    )}
                    {actionCell && (
                      <div className="flex shrink-0 items-center gap-1">
                        {flexRender(
                          actionCell.column.columnDef.cell,
                          actionCell.getContext(),
                        )}
                      </div>
                    )}
                  </div>
                  {detailCells.length > 0 && (
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-3">
                      {detailCells.map((cell) => {
                        const column = columns.find(
                          (item) => item.key === cell.column.id,
                        );
                        return (
                          <div key={cell.id} className="min-w-0">
                            <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
                              {column?.label}
                            </dt>
                            <dd className="mt-1 break-words text-xs font-medium">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  )}
                </article>
              );
            })
          ) : (
            <p className="rounded-xl border border-line bg-surface p-4 text-center text-xs text-muted">
              {emptyMessage}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:text-sm">
        <span>
          {total} résultat{total === 1 ? "" : "s"}
        </span>
        <div className="flex items-center justify-between gap-1 sm:justify-end sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            title="Afficher la page précédente"
            aria-label="Afficher la page précédente"
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft aria-hidden="true" />
            <span className="hidden sm:inline">Précédent</span>
          </Button>
          <span className="whitespace-nowrap px-1">
            Page {page} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            title="Afficher la page suivante"
            aria-label="Afficher la page suivante"
            onClick={() => onPageChange(page + 1)}
          >
            <span className="hidden sm:inline">Suivant</span>
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
