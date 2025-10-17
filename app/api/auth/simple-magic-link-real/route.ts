import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  console.log("=== Simple Magic Link API Called ===");
  
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

    if (!email) {
      console.log("No email provided");
      return NextResponse.json({ 
        success: false,
        message: "Email is required" 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format:", email);
      return NextResponse.json({ 
        success: false,
        message: "Please enter a valid email address" 
      }, { status: 400 });
    }

    console.log("Processing magic link request for:", email);

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

    // Try Supabase's built-in magic link first
    console.log("Attempting Supabase magic link...");
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.filevo.io'}/auth/callback?next=/dashboard`;
    
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
        method: "supabase"
      });
    }

    // Handle rate limiting or other errors
    console.error("Supabase magic link error:", magicLinkError);
    
    // Check if it's a rate limit error
    const isRateLimit = magicLinkError.message.includes('rate') || 
                       magicLinkError.message.includes('limit') ||
                       magicLinkError.message.includes('too many requests');

    if (isRateLimit) {
      console.log("Rate limit detected, using custom email service fallback");
      
      // Send custom email via Resend with the same approach as debug API
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // Generate a real magic link that will actually authenticate the user
        const magicToken = Buffer.from(JSON.stringify({
          email: email,
          timestamp: Date.now(),
          expires: Date.now() + (60 * 60 * 1000) // 1 hour
        })).toString('base64');
        
        const magicLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.filevo.io'}/api/auth/custom-verify?token=${magicToken}&next=/dashboard`;
        
        const { error: emailError } = await resend.emails.send({
          from: process.env.RESEND_FROM || 'noreply@filevo.io',
          to: email,
          subject: 'Sign in to Filevo',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #FF4500;">Filevo</h1>
              <h2>Sign in to Filevo</h2>
              <p>Click the link below to sign in to your Filevo account:</p>
              <a href="${magicLink}" style="background: #FF4500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Sign In</a>
              <p style="margin-top: 20px; font-size: 14px; color: #666;">
                This link will expire in 1 hour for security.
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

        console.log("Custom magic link email sent successfully via Resend");
        
        return NextResponse.json({ 
          success: true, 
          message: "Magic link sent to your email.",
          method: "custom"
        });

      } catch (emailError) {
        console.error("Custom email failed:", emailError);
        
        return NextResponse.json({ 
          success: false,
          message: "Email service temporarily unavailable. Please try again later." 
        }, { status: 500 });
      }
    }

    // For other errors, return the original error message
    console.error("Non-rate-limit error:", magicLinkError.message);
    
    return NextResponse.json({ 
      success: false,
      message: magicLinkError.message 
    }, { status: 400 });

  } catch (error: unknown) {
    console.error("=== CRITICAL ERROR in simple-magic-link API ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

