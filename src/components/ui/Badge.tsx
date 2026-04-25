import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "accent";
}

export function Badge({ className = "", variant = "default", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-[var(--border-subtle)] text-[var(--muted-foreground)]",
    success: "bg-[var(--success-muted)] text-[var(--success)]",
    warning: "bg-[var(--warning-muted)] text-[var(--warning)]",
    error: "bg-[var(--destructive-muted)] text-[var(--destructive)]",
    accent: "bg-[var(--accent-muted)] text-[var(--accent-hover)]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}