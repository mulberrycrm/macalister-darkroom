import type { HTMLAttributes, ReactNode } from "react";

type BadgeVariant = "default" | "gold" | "success" | "warning" | "destructive" | "outline" | "secondary";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-dark-border text-neutral-300",
  gold: "bg-gold/15 text-gold",
  success: "bg-emerald-500/15 text-emerald-400",
  warning: "bg-amber-500/15 text-amber-400",
  destructive: "bg-red-500/15 text-red-400",
  outline: "border border-dark-border text-neutral-400",
  secondary: "bg-dark-surface text-neutral-300",
};

export function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-[2px] text-[10px] font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
