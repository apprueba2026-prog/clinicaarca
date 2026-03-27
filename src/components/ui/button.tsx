import { cn } from "@/lib/utils/cn";
import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const variantStyles = {
  primary:
    "bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-95",
  secondary:
    "bg-surface-container-high text-primary font-bold hover:bg-surface-container-highest",
  ghost:
    "text-primary font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50",
  danger:
    "bg-error text-on-error font-bold shadow-lg shadow-error/20 hover:bg-error-container hover:text-on-error-container active:scale-95",
  outline:
    "border-2 border-outline-variant text-on-surface-variant font-semibold hover:bg-primary hover:text-white hover:border-primary",
};

const sizeStyles = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-6 py-2.5 rounded-lg",
  lg: "px-8 py-4 text-lg rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-150 ease-in-out cursor-pointer",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
