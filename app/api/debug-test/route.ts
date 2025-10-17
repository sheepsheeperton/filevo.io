import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: "Debug test GET working",
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({ 
    success: true, 
    message: "Debug test POST working",
    timestamp: new Date().toISOString()
  });
}
