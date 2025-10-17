"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/app/properties", label: "Properties" },
  { href: "/app/activity", label: "Activity" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "sticky top-0 h-dvh bg-surface border-r border-border p-4 flex flex-col gap-4 transition-transform duration-300 ease-in-out",
        // Desktop: always visible
        "lg:translate-x-0 lg:z-auto",
        // Mobile: slide in/out
        sidebarOpen ? "translate-x-0 z-50" : "-translate-x-full z-50",
        // Fixed positioning on mobile
        "fixed lg:relative w-64 lg:w-auto"
      )}>
        <div className="flex items-center justify-between">
          <Logo variant="full" />
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-1">
            {nav.map((n) => {
              const active = pathname?.startsWith(n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={() => setSidebarOpen(false)} // Close sidebar on mobile when navigating
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header with hamburger menu */}
        <header className="lg:hidden bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          <Logo variant="full" className="h-8" />
          <div className="w-9" /> {/* Spacer for centering */}
        </header>

        {/* Main content area */}
        <main className="bg-bg p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

