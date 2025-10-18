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
          width={32} 
          height={32} 
          priority 
          className="flex-shrink-0"
        />
        <Image 
          src="/brand/filevo-wordmark.svg" 
          alt="Filevo" 
          width={120} 
          height={28} 
          priority 
          className="flex-shrink-0"
        />
      </Link>
    );
  }

  const src = variant === "icon" ? "/brand/filevo-icon.svg" : "/brand/filevo-wordmark.svg";
  const size = variant === "icon" ? { w: 28, h: 28 } : { w: 120, h: 28 };

  return (
    <Link 
      href="/" 
      className={clsx("inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:hsl(var(--ring))] focus-visible:ring-offset-2", className)}
    >
      <Image src={src} alt="Filevo" width={size.w} height={size.h} priority />
    </Link>
  );
}

