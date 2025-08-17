// Simple test function with CORS and richer logging
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve((req) => {
  console.log('Test function called', { method: req.method, url: req.url });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  return new Response(JSON.stringify({ 
    message: 'Test function is working and reachable!',
    method: req.method,
    timestamp: new Date().toISOString()
  }), {
    headers: { 
      'Content-Type': 'application/json',
      ...corsHeaders,
    }
  });
});
