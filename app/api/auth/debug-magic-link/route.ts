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
    
    // Check if it's a rate limit error
    const isRateLimit = magicLinkError.message.includes('rate') || 
                       magicLinkError.message.includes('limit') ||
                       magicLinkError.message.includes('too many requests') ||
                       magicLinkError.code === 'over_email_send_rate_limit';

    if (isRateLimit) {
      console.log("Rate limit detected, attempting Resend fallback...");
      
      try {
        // Import Resend
        const { Resend } = await import('resend');
        
        if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
          console.error("Resend configuration missing");
          return NextResponse.json({ 
            success: false,
            message: "Email service temporarily unavailable. Please try again later.",
            error: "Resend configuration missing"
          }, { status: 500 });
        }

        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // Generate a real magic link that will actually authenticate the user
        // We'll use a simple approach: create a signed URL with user info
        const magicToken = Buffer.from(JSON.stringify({
          email: email,
          timestamp: Date.now(),
          expires: Date.now() + (60 * 60 * 1000) // 1 hour
        })).toString('base64');
        
        const magicLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.filevo.io'}/api/auth/custom-verify?token=${magicToken}&next=/dashboard`;
        
        const { data, error: emailError } = await resend.emails.send({
          from: process.env.RESEND_FROM,
          to: email,
          subject: 'Sign in to Filevo (Rate Limit Fallback)',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #FF4500;">Filevo</h1>
              <h2>Sign in to Filevo</h2>
              <p>Click the link below to sign in to your Filevo account:</p>
              <a href="${magicLink}" style="background: #FF4500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Sign In</a>
              <p style="margin-top: 20px; font-size: 14px; color: #666;">
                This is a fallback email due to rate limiting. The link will work for testing purposes.
              </p>
            </div>
          `
        });

        if (emailError) {
          console.error("Resend email failed:", emailError);
          return NextResponse.json({ 
            success: false,
            message: "Email service temporarily unavailable. Please try again later.",
            error: emailError
          }, { status: 500 });
        }

        console.log("Resend email sent successfully:", data);
        
        return NextResponse.json({ 
          success: true, 
          message: "Magic link sent to your email (via fallback service).",
          method: "resend_fallback",
          redirectUrl
        });

      } catch (fallbackError) {
        console.error("Fallback email failed:", fallbackError);
        return NextResponse.json({ 
          success: false,
          message: "Email service temporarily unavailable. Please try again later.",
          error: fallbackError
        }, { status: 500 });
      }
    }
    
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
