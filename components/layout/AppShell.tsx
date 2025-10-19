"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { 
  LayoutDashboard, 
  UserPlus, 
  Wrench, 
  FolderArchive, 
  Building2, 
  Activity 
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workflows/onboarding-renewals", label: "Onboarding & Renewals", icon: UserPlus },
  { href: "/workflows/maintenance", label: "Maintenance & Vendor Receipts", icon: Wrench },
  { href: "/workflows/audit", label: "Ownership / Accounting / Audit", icon: FolderArchive },
  { href: "/app/properties", label: "Properties", icon: Building2 },
  { href: "/app/activity", label: "Activity", icon: Activity },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen lg:flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "bg-surface border-r border-border flex flex-col transition-transform duration-300 ease-in-out h-screen relative",
        // Desktop: always visible and takes space
        "lg:translate-x-0 lg:z-auto lg:block lg:relative lg:w-[260px] lg:sticky lg:top-0",
        // Mobile: slide in/out and doesn't take space when hidden
        sidebarOpen ? "translate-x-0 z-50" : "-translate-x-full z-50",
        // Fixed positioning on mobile only, hidden when closed
        "fixed w-64",
        // Hide completely when closed on mobile to not take up space
        sidebarOpen ? "block" : "hidden lg:block"
      )}>
        {/* Header section with padding */}
        <div className="p-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            <Logo variant="combined" href="/dashboard" />
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
        </div>
        
        {/* Navigation section with padding */}
        <nav className="flex-1 px-4 pb-24">
          <ul className="space-y-1">
            {nav.map((n) => {
              const active = pathname?.startsWith(n.href);
              const IconComponent = n.icon;
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={() => setSidebarOpen(false)} // Close sidebar on mobile when navigating
                    className={clsx(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:hsl(var(--ring))]",
                      active ? "bg-elev text-fg" : "text-fg-muted hover:bg-elev"
                    )}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{n.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Footer section with padding - absolutely positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          <LogoutButton />
          <div className="flex items-center justify-between">
            <span className="text-xs text-fg-subtle">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main content - full width on mobile, flex-1 on desktop */}
      <div className="w-full lg:flex-1 lg:flex lg:flex-col">
        {/* Mobile header with hamburger menu */}
        <header className="lg:hidden bg-surface border-b border-border px-4 py-2 flex items-center justify-between">
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
          <Logo variant="combined" className="h-8" />
          <div className="w-9" /> {/* Spacer for centering */}
        </header>

        {/* Main content area - full width on mobile */}
        <main className="bg-bg px-4 py-4 sm:p-6 lg:p-8 space-y-6 flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

