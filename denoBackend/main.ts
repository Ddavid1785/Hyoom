
console.log("🚀 Hyoom Deno backend starting...");

Deno.serve({ port: 3000 }, async (req) => {
  const url = new URL(req.url);
  
  const headers = {
    "Access-Control-Allow-Origin": "*",   
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (url.pathname === "/chat" && req.method === "POST") {
    const body = await req.json();
    
    console.log("📨 Received:", body);
    
    return Response.json({
      content: "Hello from Deno! (not connected to AI yet)"
    }, {headers});
  }
  
  if (url.pathname === "/health") {
    return Response.json({ status: "ok" }, {headers});
  }
  
  return new Response("Not Found", { status: 404, headers });
});

console.log("✅ Server running on http://localhost:3000");