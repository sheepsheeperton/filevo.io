export async function GET() {
  return new Response(JSON.stringify({ 
    success: true, 
    message: "Ping successful",
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST() {
  return new Response(JSON.stringify({ 
    success: true, 
    message: "Ping POST successful",
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
