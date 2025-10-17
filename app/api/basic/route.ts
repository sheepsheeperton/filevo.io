export async function GET() {
  return new Response(JSON.stringify({ message: "Basic API works" }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
