import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 ease-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl";

    const variantStyles = {
      primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] focus-visible:ring-[var(--accent)] active:scale-[0.98] shadow-sm hover:shadow-md",
      secondary: "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] focus-visible:ring-[var(--accent)] active:scale-[0.98]",
      outline: "border-2 border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] focus-visible:ring-[var(--accent)] active:scale-[0.98]",
      ghost: "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border-subtle)] focus-visible:ring-[var(--accent)] active:scale-[0.98]",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-5 py-2.5 text-base gap-2",
      lg: "px-6 py-3 text-lg gap-2",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";