import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email-service";
import { ulid } from "ulid";

export async function POST(request: NextRequest) {
  console.log("=== Custom Magic Link API Called ===");
  
  try {
    console.log("Step 1: Parsing request body");
    const body = await request.json();
    const { email } = body;
    console.log("Email received:", email);

    if (!email) {
      console.log("No email provided");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("Step 2: Creating Supabase client");
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

    console.log("Step 3: Checking if user exists");
    let userExists = false;
    
    try {
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      if (!userError && users) {
        const existingUser = users.users.find(user => user.email === email);
        if (existingUser) {
          userExists = true;
          console.log("User exists:", existingUser.id);
        } else {
          console.log("User does not exist, will create new account");
        }
      } else {
        console.log("Error listing users:", userError);
      }
    } catch (error) {
      console.error('Error checking user existence:', error);
      // Continue anyway - we'll assume it's a new user
    }

    console.log("Step 4: Using Supabase's built-in magic link (bypassing our custom table)");
    
    // For now, let's use Supabase's built-in magic link but with better error handling
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm?next=/dashboard`;
    console.log("Redirect URL:", redirectUrl);
    
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (magicLinkError) {
      console.error('Supabase magic link error:', magicLinkError);
      
      // If we get a rate limit error, try our custom email service as fallback
      if (magicLinkError.message.includes('rate') || magicLinkError.message.includes('limit')) {
        console.log("Rate limit detected, using custom email service as fallback");
        
        // Generate a simple magic link token
        const magicToken = ulid();
        const magicLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/verify-magic-link?token=${magicToken}`;

        // Send email using our reliable Resend service
        const emailSubject = userExists ? 'Sign in to Filevo' : 'Welcome to Filevo - Confirm your account';
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
              .button { display: inline-block; padding: 12px 24px; margin-top: 20px; background-color: #FF4500; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>${userExists ? 'Sign in to Filevo' : 'Welcome to Filevo!'}</h2>
              <p>Hello,</p>
              <p>${userExists 
                ? `Click the link below to sign in to your Filevo account:`
                : `Thank you for signing up! Click the link below to confirm your account and get started:`
              }</p>
              <p><a href="${magicLink}" class="button">${userExists ? 'Sign In' : 'Confirm Account'}</a></p>
              <p>This link will expire in 1 hour for security.</p>
              <p>If you didn't request this ${userExists ? 'sign-in' : 'account creation'}, please ignore this email.</p>
              <div class="footer">
                <p>Thanks,<br/>The Filevo Team</p>
                <p>This email was sent to ${email}</p>
              </div>
            </div>
          </body>
          </html>
        `;

        try {
          await sendEmail({
            to: email,
            subject: emailSubject,
            html: emailHtml
          });
          
          console.log("Custom email sent successfully");
          return NextResponse.json({ 
            success: true, 
            message: "Magic link sent to your email via custom service.",
            isSignup: !userExists
          });
        } catch (emailError) {
          console.error("Custom email failed:", emailError);
          return NextResponse.json({ 
            success: false, 
            message: "Email service temporarily unavailable. Please try again later." 
          }, { status: 500 });
        }
      }
      
      return NextResponse.json({ 
        success: false, 
        message: magicLinkError.message 
      }, { status: 400 });
    }

    console.log("Supabase magic link sent successfully");
    return NextResponse.json({ 
      success: true, 
      message: "Magic link sent to your email.",
      isSignup: !userExists
    });

  } catch (error: unknown) {
    console.error("=== CRITICAL ERROR in custom-magic-link API ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("Full error object:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
