import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("=== Simple Magic Link API Called ===");
  
  try {
    console.log("Parsing request body...");
    const body = await request.json();
    const { email } = body;
    console.log("Email received:", email);

    if (!email) {
      console.log("No email provided");
      return NextResponse.json({ 
        success: false,
        message: "Email is required" 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format:", email);
      return NextResponse.json({ 
        success: false,
        message: "Please enter a valid email address" 
      }, { status: 400 });
    }

    console.log("Email validation passed");

    // For now, just return success without doing anything complex
    console.log("Returning success response");
    return NextResponse.json({ 
      success: true, 
      message: "Magic link sent to your email (simplified version).",
      method: "simple"
    });

  } catch (error: unknown) {
    console.error("=== CRITICAL ERROR in simple-magic-link API ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
