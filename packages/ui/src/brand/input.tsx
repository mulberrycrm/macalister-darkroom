import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <div>
        <input
          ref={ref}
          className={`block w-full rounded-lg border bg-dark-surface px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 transition-colors focus:outline-none focus:ring-0 focus:border-dark-border-accent disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? "border-red-500 focus:border-red-500"
              : "border-dark-border"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
