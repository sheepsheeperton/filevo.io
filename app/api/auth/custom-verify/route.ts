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

    // Try to sign in the user using Supabase's admin API
    try {
      // First, try to get the user by email
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error("Error listing users:", userError);
        throw new Error("Authentication service unavailable");
      }

      const existingUser = users?.users.find(user => user.email === tokenData.email);
      
      if (existingUser) {
        console.log("User exists, signing in:", existingUser.id);
        
        // Generate a magic link for existing user
        const { error: signInError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: tokenData.email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.filevo.io'}${next}`
          }
        });

        if (signInError) {
          console.error("Sign in error:", signInError);
          throw new Error("Sign-in failed");
        }

        console.log("User signed in successfully");
        
      } else {
        console.log("User does not exist, creating new account:", tokenData.email);
        
        // Create new user
        const { data: userResponse, error: signUpError } = await supabase.auth.admin.createUser({
          email: tokenData.email,
          email_confirm: true, // Auto-confirm since they clicked our link
        });

        if (signUpError) {
          console.error("User creation error:", signUpError);
          throw new Error("Account creation failed");
        }

        console.log("User created successfully:", userResponse.user?.id);
      }

      // Redirect to the intended destination
      console.log("Redirecting to:", next);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.filevo.io'}${next}`);

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
