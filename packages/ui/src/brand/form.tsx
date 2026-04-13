import type { HTMLAttributes, ReactNode } from "react";

interface FormProps extends HTMLAttributes<HTMLFormElement> {
  children: ReactNode;
}

export function Form({ className = "", children, ...props }: FormProps) {
  return (
    <form className={`space-y-4 ${className}`} {...props}>
      {children}
    </form>
  );
}

interface FormItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function FormItem({ className = "", children, ...props }: FormItemProps) {
  return (
    <div className={`space-y-1.5 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface FormLabelProps extends HTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export function FormLabel({
  className = "",
  children,
  ...props
}: FormLabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-neutral-100 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}

interface FormDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function FormDescription({
  className = "",
  children,
  ...props
}: FormDescriptionProps) {
  return (
    <p className={`text-xs text-neutral-400 ${className}`} {...props}>
      {children}
    </p>
  );
}

interface FormMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}

export function FormMessage({
  className = "",
  children,
  ...props
}: FormMessageProps) {
  if (!children) return null;
  return (
    <p className={`text-xs text-red-400 ${className}`} {...props}>
      {children}
    </p>
  );
}

interface FormControlProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function FormControl({
  className = "",
  children,
  ...props
}: FormControlProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

interface FormFieldProps {
  control?: any;
  name: string;
  render: (props: { field: any }) => ReactNode;
}

export function FormField({ name, render }: FormFieldProps) {
  const field = {
    name,
    onChange: () => {},
    onBlur: () => {},
    value: "",
  };

  return <>{render({ field })}</>;
}
