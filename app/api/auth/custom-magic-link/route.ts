import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email-service";
import { ulid } from "ulid";

export async function POST(request: NextRequest) {
  console.log("=== Custom Magic Link API Called ===");
  
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

    // Check if user exists
    let userExists = false;
    let userId: string | null = null;
    
    try {
      console.log("Checking if user exists...");
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error("Error listing users:", userError);
      } else if (users) {
        const existingUser = users.users.find(user => user.email === email);
        if (existingUser) {
          userExists = true;
          userId = existingUser.id;
          console.log("User exists:", existingUser.id);
        } else {
          console.log("User does not exist, will create new account");
        }
      }
    } catch (error) {
      console.error("Error checking user existence:", error);
      // Continue anyway - we'll handle this gracefully
    }

    // Try Supabase's built-in magic link first
    console.log("Attempting Supabase magic link...");
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm?next=/app/dashboard`;
    
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
      
      // Generate custom magic link token
      const magicToken = ulid();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Store token in database (if table exists)
      try {
        const { error: tokenError } = await supabase
          .from('magic_link_tokens')
          .insert({
            email,
            token: magicToken,
            user_id: userId,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
            is_signup: !userExists
          });

        if (tokenError) {
          console.error("Error storing magic link token:", tokenError);
          // Continue anyway - we'll still send the email
        } else {
          console.log("Magic link token stored successfully");
        }
      } catch (dbError) {
        console.error("Database error (table may not exist):", dbError);
        // Continue anyway - we'll still send the email
      }

      // Generate magic link URL
      const magicLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/verify-magic-link?token=${magicToken}`;

      // Send custom email via Resend
      try {
        const emailSubject = userExists ? 'Sign in to Filevo' : 'Welcome to Filevo - Confirm your account';
        
        await sendEmail({
          to: email,
          subject: emailSubject,
          html: generateMagicLinkEmailHtml({
            email,
            magicLink,
            isSignup: !userExists
          })
        });

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
    console.error("=== CRITICAL ERROR in custom-magic-link API ===");
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

// Generate branded HTML email template
function generateMagicLinkEmailHtml({ email, magicLink, isSignup }: {
  email: string;
  magicLink: string;
  isSignup: boolean;
}) {
  const title = isSignup ? 'Welcome to Filevo!' : 'Sign in to Filevo';
  const heading = isSignup ? 'Welcome to Filevo!' : 'Sign in to Filevo';
  const bodyText = isSignup 
    ? 'Thank you for signing up! Click the link below to confirm your account and get started:'
    : 'Click the link below to sign in to your Filevo account:';
  const buttonText = isSignup ? 'Confirm Account' : 'Sign In';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #FF4500 0%, #FF6B35 100%);
          padding: 32px;
          text-align: center;
        }
        .logo {
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
          margin: 0;
        }
        .content {
          padding: 32px;
        }
        .heading {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 16px 0;
        }
        .body-text {
          font-size: 16px;
          color: #4b5563;
          margin: 0 0 24px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #FF4500 0%, #FF6B35 100%);
          color: #ffffff;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          margin: 0 0 24px 0;
        }
        .button:hover {
          background: linear-gradient(135deg, #e63900 0%, #e55a2b 100%);
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px 32px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
        }
        .footer p {
          margin: 0 0 8px 0;
        }
        .security-note {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 16px;
          margin: 24px 0;
          font-size: 14px;
        }
        @media (max-width: 600px) {
          .container {
            margin: 0;
            border-radius: 0;
          }
          .header, .content, .footer {
            padding: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo">Filevo</h1>
        </div>
        
        <div class="content">
          <h2 class="heading">${heading}</h2>
          <p class="body-text">${bodyText}</p>
          
          <a href="${magicLink}" class="button">${buttonText}</a>
          
          <div class="security-note">
            <strong>Security note:</strong> This link will expire in 1 hour for security. If you didn't request this ${isSignup ? 'account creation' : 'sign-in'}, please ignore this email.
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Filevo</strong> - Secure document collection for property managers</p>
          <p>This email was sent to ${email}</p>
          <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #9ca3af;">${magicLink}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}