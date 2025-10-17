import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendPasswordResetEmail } from "@/lib/email-service";
import { ulid } from "ulid";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

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

    // Check if user exists using the database directly
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        success: true, 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // Generate a secure reset token
    const resetToken = ulid();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store the reset token in a custom table (you'll need to create this)
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (tokenError) {
      console.error('Error storing reset token:', tokenError);
      return NextResponse.json({ 
        success: true, 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // Generate the reset link
    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    // Send email using our reliable service
    try {
      await sendPasswordResetEmail(email, resetLink);
      
      return NextResponse.json({ 
        success: true, 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Clean up the token if email failed
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('email', email)
        .eq('token', resetToken);

      return NextResponse.json({ 
        success: false, 
        message: "Failed to send password reset email. Please try again later." 
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error("Error in reset-password API:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 });
  }
}
