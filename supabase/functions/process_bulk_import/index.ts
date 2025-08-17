// Simple underscore-named test for bulk import processing
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log('=== process_bulk_import CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    console.log('Raw body:', bodyText);
    let jobId: string | null = null;
    try {
      const parsed = JSON.parse(bodyText || '{}');
      jobId = parsed?.jobId ?? null;
    } catch (_) {
      // ignore parse error, just echo back
    }

    // Minimal OK response to verify routing and CORS
    return new Response(
      JSON.stringify({
        ok: true,
        function: 'process_bulk_import',
        message: 'Function reachable and responding',
        jobId,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
