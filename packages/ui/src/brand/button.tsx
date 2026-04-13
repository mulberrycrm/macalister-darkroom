/**
 * Brand Button — mirrors the canonical shadcn/CVA Button in
 * apps/crm/src/components/ui/button.tsx.
 *
 * Both import paths now produce the same component with identical variants.
 * If you add variants, add them in BOTH files (or migrate all imports to one path).
 */
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-dark-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gold text-dark-bg hover:bg-gold/90",
        primary: "bg-gold text-dark-bg hover:bg-gold/90",
        outline:
          "border border-dark-border bg-dark-bg hover:bg-dark-border text-neutral-200",
        ghost: "hover:bg-dark-border text-neutral-200 hover:text-gold",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        secondary: "bg-neutral-700 text-neutral-100 hover:bg-neutral-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        md: "h-10 px-4 py-2",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
