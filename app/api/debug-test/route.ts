import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  console.log("=== Debug Test GET Called ===");
  return NextResponse.json({ 
    success: true, 
    message: "Debug test GET working",
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  console.log("=== Debug Test POST Called ===");
  
  try {
    const body = await request.json();
    console.log("Debug Test: Received body:", body);
    
    return NextResponse.json({ 
      success: true, 
      message: "Debug test POST working",
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Debug Test error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to parse JSON in debug test",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 400 });
  }
}
