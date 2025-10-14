import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Supabase JS needs Node APIs – force Node runtime for this route
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";
  
  if (!code) return NextResponse.redirect(`${origin}/auth/sign-in`);

  // Next 15: cookies() is async
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(
      `${origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`
    );
  }
  
  // Ensure we redirect to the correct path
  const redirectUrl = `${origin}${next}`;
  console.log('Auth callback success, redirecting to:', redirectUrl);
  
  return NextResponse.redirect(redirectUrl);
}

