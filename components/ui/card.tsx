import { PropsWithChildren } from "react";
import clsx from "clsx";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("rounded-2xl bg-surface border border-border", className)}>{children}</div>;
}

export function CardHeader({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("p-6 pb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <h3 className={clsx("text-lg font-semibold", className)}>{children}</h3>;
}

export function CardDescription({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <p className={clsx("text-sm text-fg-muted", className)}>{children}</p>;
}

export function CardContent({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("p-6", className)}>{children}</div>;
}

