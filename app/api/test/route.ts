import { NextResponse } from 'next/server';

export async function GET() {
  console.log('GET /api/test called');
  return NextResponse.json({ 
    message: "API is working",
    timestamp: new Date().toISOString(),
    method: "GET"
  });
}

export async function POST() {
  console.log('POST /api/test called');
  return NextResponse.json({ 
    message: "POST is working",
    timestamp: new Date().toISOString(),
    method: "POST"
  });
}
