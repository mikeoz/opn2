// Simple test function
Deno.serve((req) => {
  console.log('Test function called');
  
  return new Response(JSON.stringify({ 
    message: 'Test function is working!',
    timestamp: new Date().toISOString()
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    }
  });
});