import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
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

    // Find the reset token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ 
        error: "Invalid or expired reset token" 
      }, { status: 400 });
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: "Reset token has expired" 
      }, { status: 400 });
    }

    // Get user by email using admin API
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError || !users) {
      return NextResponse.json({ 
        error: "User not found" 
      }, { status: 400 });
    }

    const user = users.users.find(u => u.email === tokenData.email);
    
    if (!user) {
      return NextResponse.json({ 
        error: "User not found" 
      }, { status: 400 });
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json({ 
        error: "Failed to update password" 
      }, { status: 500 });
    }

    // Mark token as used
    const { error: tokenUpdateError } = await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    if (tokenUpdateError) {
      console.error('Error updating token:', tokenUpdateError);
      // Don't fail the request, the password is already updated
    }

    return NextResponse.json({ 
      success: true, 
      message: "Password updated successfully" 
    });

  } catch (error: unknown) {
    console.error("Error in reset-password-confirm API:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
