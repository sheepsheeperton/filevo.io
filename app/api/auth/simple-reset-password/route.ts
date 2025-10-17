import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  console.log("=== Simple Reset Password API Called ===");
  
  try {
    console.log("Step 1: Parsing request body");
    let body;
    try {
      body = await request.json();
      console.log("Request body parsed successfully:", body);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    
    const { email } = body;
    console.log("Email extracted:", email);

    if (!email) {
      console.log("No email provided");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("Step 2: Checking environment variables");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log("Supabase URL set:", !!supabaseUrl);
    console.log("Supabase Key set:", !!supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    console.log("Step 3: Creating Supabase client");
    const cookieStore = await cookies();

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
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
    
    console.log("Supabase client created successfully");

    console.log("Step 4: Calling Supabase resetPasswordForEmail");
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password`;
    console.log("Redirect URL:", redirectUrl);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    console.log("Supabase response received");
    
    if (error) {
      console.error('Password reset error:', error);
      return NextResponse.json({ 
        success: false, 
        message: error.message 
      }, { status: 400 });
    }

    console.log("Password reset successful, returning success response");
    return NextResponse.json({ 
      success: true, 
      message: "If an account with that email exists, a password reset link has been sent." 
    });

  } catch (error: unknown) {
    console.error("=== CRITICAL ERROR in simple-reset-password API ===");
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
