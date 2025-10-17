import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("=== ULTRA SIMPLE RESET API CALLED ===");
  
  try {
    console.log("Step 1: Getting request body");
    const body = await request.json();
    console.log("Body received:", body);
    
    const { email } = body;
    console.log("Email extracted:", email);
    
    if (!email) {
      console.log("No email provided, returning error");
      return NextResponse.json({ 
        success: false, 
        error: "Email is required" 
      }, { status: 400 });
    }
    
    console.log("Step 2: Simulating success");
    
    // Just return a success response without doing anything
    const response = {
      success: true,
      message: "Ultra simple API working - would send email to: " + email,
      timestamp: new Date().toISOString()
    };
    
    console.log("Step 3: Returning response:", response);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("=== ULTRA SIMPLE API ERROR ===");
    console.error("Error:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: "Ultra simple API error: " + (error instanceof Error ? error.message : "Unknown error")
    }, { status: 500 });
  }
}
