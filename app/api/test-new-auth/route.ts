import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("=== New Auth Test API Called ===");
  
  try {
    console.log("Parsing request body...");
    const body = await request.json();
    console.log("Request body:", body);
    
    const { email } = body;
    console.log("Email:", email);

    if (!email) {
      console.log("No email provided");
      return NextResponse.json({ 
        success: false,
        message: "Email is required" 
      }, { status: 400 });
    }

    console.log("Returning success response");
    return NextResponse.json({ 
      success: true, 
      message: `Test successful for ${email}`,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error("=== ERROR in test-new-auth API ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    
    return NextResponse.json({ 
      success: false, 
      message: "Test API failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
