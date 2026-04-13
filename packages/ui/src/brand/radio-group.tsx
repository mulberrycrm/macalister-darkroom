"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { createContext, useContext } from "react";

interface RadioGroupContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextType | undefined>(undefined);

interface RadioGroupProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

export function RadioGroup({
  value,
  onValueChange,
  className = "",
  children,
  ...props
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={`space-y-2 ${className}`} role="radiogroup" {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps extends HTMLAttributes<HTMLInputElement> {
  value: string;
  id: string;
}

export function RadioGroupItem({
  value,
  id,
  className = "",
  ...props
}: RadioGroupItemProps) {
  const context = useContext(RadioGroupContext);

  if (!context) {
    throw new Error("RadioGroupItem must be used within RadioGroup");
  }

  return (
    <input
      type="radio"
      id={id}
      value={value}
      checked={context.value === value}
      onChange={() => context.onValueChange(value)}
      className={`h-4 w-4 cursor-pointer accent-gold ${className}`}
      {...props}
    />
  );
}
