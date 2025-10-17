import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: "Ultra simple API works",
    timestamp: new Date().toISOString(),
    method: "GET"
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: "Ultra simple API works",
    timestamp: new Date().toISOString(),
    method: "POST"
  });
}
