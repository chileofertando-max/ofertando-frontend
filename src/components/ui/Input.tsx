import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          ref={ref}
          className={`input ${error ? "border-[var(--destructive)] focus:border-[var(--destructive)] focus:ring-[var(--destructive-muted)]" : ""} ${className || ""}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[var(--destructive)]">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
