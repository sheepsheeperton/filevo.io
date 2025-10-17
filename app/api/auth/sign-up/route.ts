import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendSignUpConfirmationEmail } from "@/lib/email-service";
import { ulid } from "ulid";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Create user with email confirmation disabled
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // We'll handle confirmation ourselves
    });

    if (authError) {
      console.error('User creation error:', authError);
      return NextResponse.json({ 
        error: authError.message 
      }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ 
        error: "Failed to create user" 
      }, { status: 500 });
    }

    // Generate a secure confirmation token
    const confirmationToken = ulid();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store the confirmation token in a custom table
    const { error: tokenError } = await supabase
      .from('email_confirmation_tokens')
      .insert({
        user_id: authData.user.id,
        email,
        token: confirmationToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (tokenError) {
      console.error('Error storing confirmation token:', tokenError);
      // Clean up the user if token storage failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ 
        error: "Failed to create confirmation token" 
      }, { status: 500 });
    }

    // Generate the confirmation link
    const confirmationLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm-email?token=${confirmationToken}`;

    // Send email using our reliable service
    try {
      await sendSignUpConfirmationEmail(email, confirmationLink);
      
      return NextResponse.json({ 
        success: true, 
        message: "Account created successfully. Please check your email to confirm your account.",
        user: {
          id: authData.user.id,
          email: authData.user.email
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Clean up the user and token if email failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      await supabase
        .from('email_confirmation_tokens')
        .delete()
        .eq('user_id', authData.user.id)
        .eq('token', confirmationToken);

      return NextResponse.json({ 
        error: "Failed to send confirmation email. Please try again later." 
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error("Error in sign-up API:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
