import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SITE_URL: !!process.env.SITE_URL,
  });
}

