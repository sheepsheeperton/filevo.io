"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-6 w-11 rounded-full bg-elev border" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-6 w-11 rounded-full bg-elev border relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:hsl(var(--ring))]"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute top-1 h-4 w-4 rounded-full bg-fg transition-transform ${
          theme === "dark" ? "left-1" : "left-6"
        }`}
      />
    </button>
  );
}

