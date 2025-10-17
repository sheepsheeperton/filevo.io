import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
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

    // Test password reset email sending
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password`,
    });

    if (error) {
      console.error("Password reset email error:", error);
      return NextResponse.json({ 
        success: false, 
        message: "Failed to send password reset email", 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Password reset email sent successfully",
      note: "Check your email for reset instructions. If not received, check spam folder."
    });

  } catch (error: unknown) {
    console.error("Exception in test-forgot-password API:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error during password reset email send", 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Test forgot password email endpoint",
    usage: "POST with { email: 'your@email.com' } to test password reset email sending",
    environment: {
      SUPABASE_URL_SET: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SITE_URL_SET: !!process.env.NEXT_PUBLIC_SITE_URL,
    }
  });
}
