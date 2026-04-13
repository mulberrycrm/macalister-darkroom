import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <div>
        <textarea
          ref={ref}
          className={`block w-full rounded-md border bg-dark-bg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gold disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-dark-border focus:border-gold"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
