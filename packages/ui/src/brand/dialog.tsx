import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useState } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onOpenChange(false)}
    >
      {children}
    </div>
  );
}

interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function DialogContent({
  className = "",
  children,
  ...props
}: DialogContentProps) {
  return (
    <div
      className={`relative w-full max-w-2xl rounded-lg border border-dark-border bg-dark-surface p-6 shadow-lg ${className}`}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
}

interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function DialogHeader({ className = "", children, ...props }: DialogHeaderProps) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function DialogTitle({
  className = "",
  children,
  ...props
}: DialogTitleProps) {
  return (
    <h2 className={`text-xl font-semibold text-neutral-100 ${className}`} {...props}>
      {children}
    </h2>
  );
}

interface DialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function DialogDescription({
  className = "",
  children,
  ...props
}: DialogDescriptionProps) {
  return (
    <p className={`text-sm text-neutral-400 ${className}`} {...props}>
      {children}
    </p>
  );
}
