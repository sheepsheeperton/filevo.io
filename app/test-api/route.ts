import { NextResponse } from "next/server";

export async function GET() {
  console.log("=== Simple Test API GET ===");
  return NextResponse.json({ 
    success: true, 
    message: "Simple test API working",
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  console.log("=== Simple Test API POST ===");
  return NextResponse.json({ 
    success: true, 
    message: "Simple test API POST working",
    timestamp: new Date().toISOString()
  });
}
