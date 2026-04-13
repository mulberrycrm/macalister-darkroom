import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-dark-border bg-dark-surface p-4 transition-all hover:border-dark-border-accent hover:-translate-y-px cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ className = "", children, ...props }: CardHeaderProps) {
  return (
    <div className={`mb-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function CardTitle({ className = "", children, ...props }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-neutral-100 ${className}`} {...props}>
      {children}
    </h3>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function CardDescription({
  className = "",
  children,
  ...props
}: CardDescriptionProps) {
  return (
    <p className={`text-sm text-neutral-400 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = "", children, ...props }: CardContentProps) {
  return (
    <div className={`text-neutral-400 ${className}`} {...props}>
      {children}
    </div>
  );
}
