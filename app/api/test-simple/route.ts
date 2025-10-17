import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  console.log("=== Test Simple GET ===");
  return NextResponse.json({ 
    success: true, 
    message: "GET endpoint working",
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  console.log("=== Test Simple POST ===");
  
  try {
    const body = await request.json();
    console.log("Received body:", body);
    
    return NextResponse.json({ 
      success: true, 
      message: "POST endpoint working",
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Test simple error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to parse JSON",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 400 });
  }
}
