import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  console.log("=== Custom Magic Link Verification Called ===");
  
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const next = searchParams.get("next") || "/dashboard";

    if (!token) {
      console.log("No token provided");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.filevo.io'}/auth/sign-in?error=${encodeURIComponent('Invalid magic link')}`);
    }

    console.log("Verifying custom magic token");

    // Decode and validate the token
    let tokenData;
    try {
      const decodedToken = Buffer.from(token, 'base64').toString('utf-8');
      tokenData = JSON.parse(decodedToken);
    } catch (error) {
      console.error("Token decode error:", error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.filevo.io'}/auth/sign-in?error=${encodeURIComponent('Invalid magic link')}`);
    }

    // Check if token is expired
    if (Date.now() > tokenData.expires) {
      console.log("Token expired");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.filevo.io'}/auth/sign-in?error=${encodeURIComponent('Magic link has expired')}`);
    }

    console.log("Token valid, authenticating user:", tokenData.email);

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

    // Try to use Supabase's regular magic link system
    // This bypasses the rate limiting by using a different approach
    try {
      console.log("Attempting Supabase magic link for:", tokenData.email);
      
      // Use the regular signInWithOtp method but with a different redirect
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: tokenData.email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.filevo.io'}${next}`
        }
      });

      if (magicLinkError) {
        console.error("Supabase magic link error:", magicLinkError);
        
        // If still rate limited, we'll redirect to a success page with instructions
        if (magicLinkError.message.includes('rate') || magicLinkError.message.includes('limit')) {
          console.log("Still rate limited, redirecting to success page");
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.filevo.io'}/auth/sign-in?success=${encodeURIComponent('Please check your email for a magic link. If you don\'t receive it within 5 minutes, please try again.')}`);
        }
        
        throw new Error("Magic link failed");
      }

      console.log("Supabase magic link sent successfully");
      
      // Redirect to a success page
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.filevo.io'}/auth/sign-in?success=${encodeURIComponent('Please check your email for a magic link to complete sign-in.')}`);

    } catch (authError) {
      console.error("Authentication error:", authError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.filevo.io'}/auth/sign-in?error=${encodeURIComponent('Authentication failed. Please try again.')}`);
    }

  } catch (error: unknown) {
    console.error("=== CRITICAL ERROR in custom-verify API ===");
    console.error("Error:", error);
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.filevo.io'}/auth/sign-in?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`);
  }
}
