import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cardType, dimensions = "512x512" } = await req.json();
    
    console.log('Generating logo for card type:', cardType);

    const logoPrompt = `Create a clean, professional Opnli logo variation for a ${cardType} card. The logo should feature the iconic red circular design with a stylized human figure from the Opnli brand. Make it suitable for use on business cards and digital profiles. The design should be: minimalist, modern, and professional with the signature red color (#DC2626 or similar). Size should be ${dimensions}. Ultra high resolution.`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: logoPrompt,
        size: dimensions,
        quality: 'high',
        output_format: 'png',
        background: 'transparent'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // gpt-image-1 returns base64 directly
    const generatedImage = data.data[0].b64_json;
    
    console.log('Successfully generated logo for', cardType);

    return new Response(JSON.stringify({ 
      logo: `data:image/png;base64,${generatedImage}`,
      cardType 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-card-logo function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate logo', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});