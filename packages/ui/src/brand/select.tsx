"use client";

import { forwardRef, createContext, useContext, useState, type SelectHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

interface SelectProps extends HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export function Select({
  value = "",
  onValueChange,
  children,
  ...props
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: (v) => {
          onValueChange?.(v);
          setIsOpen(false);
        },
        isOpen,
        setIsOpen,
      }}
    >
      <div className="relative" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function SelectTrigger({
  className = "",
  children,
  ...props
}: SelectTriggerProps) {
  const context = useContext(SelectContext);

  if (!context) {
    throw new Error("SelectTrigger must be used within Select");
  }

  return (
    <button
      type="button"
      onClick={() => context.setIsOpen(!context.isOpen)}
      className={`flex w-full items-center justify-between rounded-md border border-dark-border bg-dark-bg px-3 py-2 text-sm text-neutral-100 transition-colors hover:border-dark-border-accent focus:outline-none focus:ring-2 focus:ring-gold disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder = "Select..." }: SelectValueProps) {
  const context = useContext(SelectContext);

  if (!context) {
    throw new Error("SelectValue must be used within Select");
  }

  return <span>{context.value || placeholder}</span>;
}

interface SelectContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function SelectContent({
  className = "",
  children,
  ...props
}: SelectContentProps) {
  const context = useContext(SelectContext);

  if (!context) {
    throw new Error("SelectContent must be used within Select");
  }

  if (!context.isOpen) {
    return null;
  }

  return (
    <div
      className={`absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-md border border-dark-border bg-dark-surface shadow-lg z-10 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface SelectItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
}

export function SelectItem({
  value,
  className = "",
  children,
  ...props
}: SelectItemProps) {
  const context = useContext(SelectContext);

  if (!context) {
    throw new Error("SelectItem must be used within Select");
  }

  const isSelected = context.value === value;

  return (
    <div
      onClick={() => context.onValueChange(value)}
      className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
        isSelected
          ? "bg-gold/20 text-gold"
          : "text-neutral-100 hover:bg-dark-border/50"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Legacy simple select component
interface LegacySelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const SelectLegacy = forwardRef<HTMLSelectElement, LegacySelectProps>(
  ({ className = "", error, children, ...props }, ref) => {
    return (
      <div>
        <select
          ref={ref}
          className={`block w-full rounded-md border bg-dark-bg px-3 py-2 text-sm text-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gold disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-dark-border focus:border-gold"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

SelectLegacy.displayName = "SelectLegacy";
