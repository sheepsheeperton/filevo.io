import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("=== Test Magic Link API Called ===");
  
  try {
    console.log("Step 1: Parsing request body");
    const body = await request.json();
    console.log("Request body:", body);
    
    const { email } = body;
    console.log("Email:", email);

    if (!email) {
      console.log("No email provided");
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("Step 2: Returning success response");
    return NextResponse.json({ 
      success: true, 
      message: `Test magic link API working for ${email}`,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error("=== ERROR in test-magic-link API ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Full error:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Test API failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
