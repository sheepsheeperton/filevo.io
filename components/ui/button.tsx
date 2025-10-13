import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
};
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", asChild = false, ...props }, ref
) {
  const Comp = asChild ? Slot : "button";
  const base = "inline-flex items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:hsl(var(--ring))]";
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  }[size];
  const variants = {
    primary: "bg-brand text-black border-transparent hover:bg-brand-600 active:bg-brand-700",
    secondary: "bg-elev text-fg border-border hover:bg-surface",
    ghost: "bg-transparent text-fg border-transparent hover:bg-elev",
  }[variant];
  return <Comp ref={ref} className={clsx(base, sizes, variants, className)} {...props} />;
});

