"use client";

import { createContext, useContext, type HTMLAttributes, type ReactNode, type ReactElement } from "react";

interface TabsContextType {
  activeTab: string;
  onValueChange?: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  children,
  defaultValue = "",
  value,
  onValueChange,
  ...props
}: TabsProps) {
  const activeTab = value !== undefined ? value : defaultValue;

  return (
    <TabsContext.Provider value={{ activeTab, onValueChange }}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function TabsList({ className = "", children, ...props }: TabsListProps) {
  return (
    <div
      className={`flex border-b border-dark-border ${className}`}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  children: ReactNode;
}

export function TabsTrigger({
  value,
  className = "",
  children,
  ...props
}: TabsTriggerProps) {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("TabsTrigger must be used within Tabs");
  }

  const isActive = context.activeTab === value;

  return (
    <button
      type="button"
      onClick={() => context.onValueChange?.(value)}
      className={`px-4 py-2 font-medium transition-colors ${
        isActive
          ? "border-b-2 border-gold text-gold"
          : "text-neutral-400 hover:text-neutral-300"
      } ${className}`}
      role="tab"
      aria-selected={isActive}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
}

export function TabsContent({
  value,
  className = "",
  children,
  ...props
}: TabsContentProps) {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("TabsContent must be used within Tabs");
  }

  if (context.activeTab !== value) {
    return null;
  }

  return (
    <div className={`py-4 ${className}`} role="tabpanel" {...props}>
      {children}
    </div>
  );
}
