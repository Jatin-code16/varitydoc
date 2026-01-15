import React from 'react';
import { cn } from '@/lib/utils';
import './Table.css';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function Table<T extends { id?: string | number }>({
  columns,
  data,
  onRowClick,
  isLoading,
  emptyMessage = 'No data available'
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full">
        {/* Desktop Skeleton */}
        <div className="hidden md:block w-full overflow-x-auto border-4 border-black bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={{ width: col.width }} className="bg-gray-100 px-4 py-3 text-left text-sm font-bold border-b-2 border-black whitespace-nowrap">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 border-b border-gray-200">
                      <div className="animate-pulse bg-gray-200 h-5 w-4/5 rounded" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Skeleton */}
        <div className="md:hidden flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border-2 border-black bg-white p-4 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 md:p-8 text-center text-gray-500 border-2 md:border-4 border-black bg-white rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-lg font-bold">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block w-full overflow-x-auto border-4 border-black bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className="bg-gray-100 px-4 py-3 text-left text-sm font-bold border-b-2 border-black whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.map((row, index) => (
              <tr
                key={row.id || index}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden flex flex-col gap-4">
        {Array.isArray(data) && data.map((row, index) => (
          <div
            key={row.id || index}
            onClick={() => onRowClick?.(row)}
            className={cn(
              "border-2 border-black bg-white p-4 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:scale-[0.99]",
              onRowClick && "cursor-pointer active:shadow-none"
            )}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex flex-col mb-3 last:mb-0">
                <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">
                  {col.header}
                </span>
                <div className="text-base font-medium break-words">
                  {col.render(row)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
