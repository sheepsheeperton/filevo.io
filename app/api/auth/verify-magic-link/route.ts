import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  console.log("=== Magic Link Verification API Called ===");
  
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      console.log("No token provided in URL");
      return redirectToError("Invalid magic link. No token provided.");
    }

    console.log("Verifying token:", token);

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

    // Look up the token in our custom table
    let tokenData;
    try {
      const { data, error: tokenError } = await supabase
        .from('magic_link_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (tokenError) {
        console.error("Token lookup error:", tokenError);
        return redirectToError("Invalid or expired magic link. Please request a new one.");
      }

      tokenData = data;
      console.log("Token found:", { email: tokenData.email, is_signup: tokenData.is_signup });

    } catch (dbError) {
      console.error("Database error during token lookup:", dbError);
      return redirectToError("Service temporarily unavailable. Please try again.");
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      console.log("Token expired:", tokenData.expires_at);
      
      // Clean up expired token
      await supabase
        .from('magic_link_tokens')
        .delete()
        .eq('token', token);
        
      return redirectToError("This magic link has expired. Please request a new one.");
    }

    const { email, is_signup, user_id } = tokenData;

    if (is_signup && !user_id) {
      // This is a signup - create the user
      console.log("Creating new user for email:", email);
      
      try {
        const { data: userResponse, error: signUpError } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true, // Auto-confirm since they clicked our link
        });

        if (signUpError) {
          console.error('User creation error:', signUpError);
          
          // Clean up the used token
          await supabase
            .from('magic_link_tokens')
            .delete()
            .eq('token', token);
            
          return redirectToError("Failed to create account. Please try again.");
        }

        if (!userResponse.user) {
          console.error("User creation failed - no user returned");
          
          // Clean up the used token
          await supabase
            .from('magic_link_tokens')
            .delete()
            .eq('token', token);
            
          return redirectToError("Account creation failed. Please try again.");
        }

        console.log("User created successfully:", userResponse.user.id);

        // Update the token with the new user ID
        await supabase
          .from('magic_link_tokens')
          .update({ user_id: userResponse.user.id })
          .eq('token', token);

      } catch (userError) {
        console.error("Error during user creation:", userError);
        
        // Clean up the used token
        await supabase
          .from('magic_link_tokens')
          .delete()
          .eq('token', token);
          
        return redirectToError("Account creation failed. Please try again.");
      }
    }

    // Sign in the user using Supabase's admin API
    console.log("Signing in user:", email);
    
    try {
      const { error: signInError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/app/dashboard`
        }
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        
        // Clean up the used token
        await supabase
          .from('magic_link_tokens')
          .delete()
          .eq('token', token);
          
        return redirectToError("Sign-in failed. Please try again.");
      }

      console.log("User signed in successfully");

    } catch (signInError) {
      console.error("Error during sign-in:", signInError);
      
      // Clean up the used token
      await supabase
        .from('magic_link_tokens')
        .delete()
        .eq('token', token);
        
      return redirectToError("Sign-in failed. Please try again.");
    }

    // Clean up the used token (single-use)
    try {
      await supabase
        .from('magic_link_tokens')
        .delete()
        .eq('token', token);
      
      console.log("Token cleaned up successfully");
    } catch (cleanupError) {
      console.error("Error cleaning up token:", cleanupError);
      // Don't fail the whole process for cleanup errors
    }

    // Redirect to dashboard
    console.log("Redirecting to dashboard");
    redirect('/app/dashboard');

  } catch (error: unknown) {
    console.error("=== CRITICAL ERROR in verify-magic-link API ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    
    return redirectToError("An unexpected error occurred. Please try again.");
  }
}

// Helper function to redirect to error page
function redirectToError(message: string) {
  const errorUrl = new URL('/auth/sign-in', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  errorUrl.searchParams.set('error', encodeURIComponent(message));
  
  console.log("Redirecting to error page with message:", message);
  
  return NextResponse.redirect(errorUrl);
}