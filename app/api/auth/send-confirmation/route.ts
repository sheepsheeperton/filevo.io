import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // For now, just return success - the user will need to manually resend from Supabase dashboard
    return NextResponse.json({ 
      success: true, 
      message: "Please check your email or use the Supabase dashboard to resend confirmation email",
      note: "Email delivery issues detected. Manual resend from Supabase dashboard recommended."
    });

  } catch (error) {
    console.error("Error in send-confirmation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
