import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  console.log("=== Debug Magic Link API Called ===");
  
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ 
        success: false,
        message: "Email is required" 
      }, { status: 400 });
    }

    console.log("Testing Supabase magic link for:", email);

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    // Test Supabase magic link
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.filevo.io'}/auth/callback?next=/dashboard`;
    console.log("Using redirect URL:", redirectUrl);
    
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (!magicLinkError) {
      console.log("Supabase magic link sent successfully");
      return NextResponse.json({ 
        success: true, 
        message: "Magic link sent to your email.",
        method: "supabase",
        redirectUrl
      });
    }

    console.error("Supabase magic link error:", magicLinkError);
    
    return NextResponse.json({ 
      success: false,
      message: magicLinkError.message,
      error: magicLinkError,
      redirectUrl
    }, { status: 400 });

  } catch (error: unknown) {
    console.error("=== CRITICAL ERROR in debug-magic-link API ===");
    console.error("Error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
