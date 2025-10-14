"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoutButton } from "@/components/logout-button";
import clsx from "clsx";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/app/properties", label: "Properties" },
  { href: "/app/activity", label: "Activity" },
  { href: "/sandbox", label: "UI Sandbox" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="sticky top-0 h-dvh bg-surface border-r border-border p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Logo variant="full" />
        </div>
        <nav className="flex-1">
          <ul className="space-y-1">
            {nav.map((n) => {
              const active = pathname?.startsWith(n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className={clsx(
                      "block rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:hsl(var(--ring))]",
                      active ? "bg-elev text-fg" : "text-fg-muted hover:bg-elev"
                    )}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="space-y-3">
          <LogoutButton />
          <div className="flex items-center justify-between">
            <span className="text-xs text-fg-subtle">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main className="bg-bg p-6 md:p-8 space-y-6">{children}</main>
    </div>
  );
}

