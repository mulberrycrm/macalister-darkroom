import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function Table({ className = "", children, ...props }: TableProps) {
  return (
    <table
      className={`w-full text-sm text-neutral-100 ${className}`}
      {...props}
    >
      {children}
    </table>
  );
}

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableHeader({
  className = "",
  children,
  ...props
}: TableHeaderProps) {
  return (
    <thead className={`border-b border-dark-border ${className}`} {...props}>
      {children}
    </thead>
  );
}

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableBody({
  className = "",
  children,
  ...props
}: TableBodyProps) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export function TableRow({
  className = "",
  children,
  ...props
}: TableRowProps) {
  return (
    <tr
      className={`border-b border-dark-border/50 transition-colors hover:bg-dark-border/20 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export function TableHead({
  className = "",
  children,
  ...props
}: TableHeadProps) {
  return (
    <th
      className={`px-4 py-2 text-left font-semibold text-neutral-300 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

export function TableCell({
  className = "",
  children,
  ...props
}: TableCellProps) {
  return (
    <td className={`px-4 py-2 ${className}`} {...props}>
      {children}
    </td>
  );
}
