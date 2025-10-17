import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: "Ping successful",
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({ 
    success: true, 
    message: "Ping POST successful",
    timestamp: new Date().toISOString()
  });
}
