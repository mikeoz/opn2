// Minimal hello function with CORS and logging
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve((req) => {
  console.log('hello function invoked', { method: req.method, url: req.url });

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ ok: true, function: 'hello', timestamp: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
});
