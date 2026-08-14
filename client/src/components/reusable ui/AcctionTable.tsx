import React from "react";
import { Button } from "@/components/ui/button";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface ActionTableProps<T> {
  title?: string;
  columns: Column<T>[];
  data: T[];
  actions?: (row: T, index: number) => React.ReactNode;
  onRowClick?: (row: T) => void;
}

export function ActionTable<T extends object>({
  title,
  columns,
  data,
  actions,
  onRowClick,
}: ActionTableProps<T>) {
  if (!data?.length) return null;

  return (
    <div className="mt-6">
      {title && <h3 className="font-semibold mb-3 text-gray-800">{title}</h3>}

      <div className="w-full max-h-[400px] overflow-x-auto overflow-y-auto border border-gray-200 dark:border-gray-700 rounded">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-border dark:border-gray-700 text-left">
              <th className="p-3 text-foreground dark:text-gray-100 font-semibold text-sm text-center w-[50px]">No.</th>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`p-3 text-foreground dark:text-gray-100 font-semibold text-sm ${col.className || ""}`}
                >
                  {col.header || ""}
                </th>
              ))}
              {actions && (
                <th className="p-3 text-foreground dark:text-gray-100 font-semibold text-sm text-center">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => onRowClick?.(row)}
              >
                <td className="p-3 text-foreground dark:text-gray-100 text-center">{idx + 1}</td>
                {columns.map((col, i) => {
                  const value =
                    typeof col.accessor === "function"
                      ? col.accessor(row)
                      : (row[col.accessor] as React.ReactNode);

                  return (
                    <td key={i} className={`p-3 text-foreground dark:text-gray-100 break-words ${col.className || ""}`}>
                      {value ?? ""}
                    </td>
                  );
                })}
                {actions && (
                  <td className="p-3 text-foreground dark:text-gray-100 text-center space-x-2">
                    {actions(row, idx)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
