import React, { useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  height?: number;
  rowHeight?: number;
  stickyHeader?: boolean;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  height = 600,
  rowHeight = 40,
  onRowClick,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const parentRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 20,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0) : 0;

  return (
    <div style={{ border: '1px solid #1e2d45', borderRadius: 8, overflow: 'hidden' }}>
      {/* Unified scrollable container with sticky header */}
      <div ref={parentRef} style={{ height, overflowY: 'auto', overflowX: 'auto', background: '#111827' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: 'max-content' }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      background: '#111827',
                      color: '#94a3b8',
                      fontFamily: 'DM Mono, monospace',
                      fontSize: 11,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '10px 12px',
                      textAlign: 'left',
                      borderBottom: '1px solid #1e2d45',
                      whiteSpace: 'nowrap',
                      cursor: header.column.getCanSort() ? 'pointer' : undefined,
                      userSelect: 'none',
                      position: 'sticky',
                      top: 0,
                      zIndex: 20,
                    }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && <tr><td style={{ height: paddingTop }} /></tr>}
            {virtualRows.map(virtualRow => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  style={{
                    background: virtualRow.index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    cursor: onRowClick ? 'pointer' : undefined,
                  }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid rgba(30,45,69,0.5)',
                        fontSize: 13,
                        color: '#f1f5f9',
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paddingBottom > 0 && <tr><td style={{ height: paddingBottom }} /></tr>}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569', fontSize: 14 }}>
            Aucune donnée à afficher
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: '#111827', borderTop: '1px solid #1e2d45', padding: '6px 12px', color: '#475569', fontSize: 11 }}>
        {rows.length.toLocaleString('fr-FR')} ligne{rows.length > 1 ? 's' : ''}
      </div>
    </div>
  );
}
