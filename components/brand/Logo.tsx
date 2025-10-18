"use client";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

type Props = { variant?: "icon" | "full" | "combined"; className?: string };

export default function Logo({ variant = "full", className }: Props) {
  if (variant === "combined") {
    return (
      <Link 
        href="/" 
        className={clsx("inline-flex items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:hsl(var(--ring))] focus-visible:ring-offset-2", className)}
      >
        <Image 
          src="/brand/filevo-icon.svg" 
          alt="Filevo" 
          width={48} 
          height={48} 
          priority 
          className="flex-shrink-0"
        />
        <span className="text-xl font-bold text-current">FILEVO.IO</span>
      </Link>
    );
  }

  const src = "/brand/filevo-icon.svg";
  const size = variant === "icon" ? { w: 48, h: 48 } : { w: 64, h: 64 };

  return (
    <Link 
      href="/" 
      className={clsx("inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:hsl(var(--ring))] focus-visible:ring-offset-2", className)}
    >
      <Image src={src} alt="Filevo" width={size.w} height={size.h} priority />
    </Link>
  );
}

