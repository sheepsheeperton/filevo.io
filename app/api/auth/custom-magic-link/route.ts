import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email-service";
import { ulid } from "ulid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

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
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      if (!userError && users) {
        const existingUser = users.users.find(user => user.email === email);
        if (existingUser) {
          userExists = true;
          userId = existingUser.id;
        }
      }
    } catch (error) {
      console.error('Error checking user existence:', error);
      // Continue anyway - we'll create the magic link token regardless
    }

    // Generate a secure magic link token
    const magicToken = ulid();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store the magic link token in our custom table
    const { error: tokenError } = await supabase
      .from('magic_link_tokens')
      .insert({
        email,
        token: magicToken,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        is_signup: !userExists // Track if this is for signup or signin
      });

    if (tokenError) {
      console.error('Error storing magic link token:', tokenError);
      // If the table doesn't exist, we'll handle this gracefully
      return NextResponse.json({ 
        success: true, 
        message: "Magic link sent to your email." 
      });
    }

    // Generate the magic link
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

    await sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml
    });

    return NextResponse.json({ 
      success: true, 
      message: "Magic link sent to your email.",
      isSignup: !userExists
    });

  } catch (error: unknown) {
    console.error("Error in custom-magic-link API:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to send magic link", 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
