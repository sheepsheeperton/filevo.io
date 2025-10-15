import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Create Supabase client
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
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Use Supabase's built-in resend confirmation email
    const { data: resendData, error: resendError } = await supabase.auth.admin.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (resendError) {
      console.error("Error resending confirmation email:", resendError);
      return NextResponse.json({ error: "Failed to resend confirmation email" }, { status: 500 });
    }

    // Return success - Supabase will send the email
    return NextResponse.json({ 
      success: true, 
      message: "Confirmation email sent via Supabase",
      data: resendData 
    });

  } catch (error) {
    console.error("Error in send-confirmation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
