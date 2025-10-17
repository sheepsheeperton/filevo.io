import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
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

    // Find the confirmation token
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_confirmation_tokens')
      .select('*')
      .eq('token', token)
      .eq('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ 
        error: "Invalid or expired confirmation token" 
      }, { status: 400 });
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: "Confirmation token has expired" 
      }, { status: 400 });
    }

    // Confirm the user's email
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { email_confirm: true }
    );

    if (confirmError) {
      console.error('Error confirming user:', confirmError);
      return NextResponse.json({ 
        error: "Failed to confirm email" 
      }, { status: 500 });
    }

    // Mark token as used
    const { error: updateError } = await supabase
      .from('email_confirmation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    if (updateError) {
      console.error('Error updating token:', updateError);
      // Don't fail the request, the email is already confirmed
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email confirmed successfully" 
    });

  } catch (error: unknown) {
    console.error("Error in confirm-email API:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
