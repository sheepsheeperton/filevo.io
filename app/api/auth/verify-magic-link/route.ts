import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Invalid magic link" }, { status: 400 });
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

  try {
    // Find the magic link token
    const { data: tokenData, error: tokenError } = await supabase
      .from('magic_link_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      console.error('Magic link token lookup error:', tokenError);
      return NextResponse.json({ error: "Invalid or expired magic link" }, { status: 400 });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: "Magic link has expired" }, { status: 400 });
    }

    const { email, user_id, is_signup } = tokenData;

    if (is_signup && !user_id) {
      // This is a signup - create the user
      const { data: userResponse, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true, // Auto-confirm since they clicked our link
      });

      if (signUpError) {
        console.error('User creation error:', signUpError);
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
      }

      if (!userResponse.user) {
        return NextResponse.json({ error: "User creation failed" }, { status: 500 });
      }

      // Update the token with the new user ID
      await supabase
        .from('magic_link_tokens')
        .update({ user_id: userResponse.user.id })
        .eq('token', token);

      // Sign in the user using magic link
      const { error: signInError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`
        }
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        // Fallback: redirect anyway since user is created
        redirect('/dashboard');
      }
    } else {
      // This is a signin - sign in the existing user
      const { error: signInError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`
        }
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
      }
    }

    // Delete the used token
    await supabase
      .from('magic_link_tokens')
      .delete()
      .eq('token', token);

    // Redirect to dashboard
    redirect('/dashboard');

  } catch (error: unknown) {
    console.error("Error in verify-magic-link API:", error);
    return NextResponse.json({ 
      error: "Failed to process magic link", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
