
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhook_url, data } = await req.json();

    if (!webhook_url || !data) {
      console.error('Missing webhook URL or data');
      throw new Error('Missing webhook URL or data');
    }

    console.log('Attempting to call webhook URL:', webhook_url);
    console.log('With data:', JSON.stringify(data, null, 2));

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('Webhook response status:', response.status);
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('Webhook call failed:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      throw new Error(`Webhook call failed with status: ${response.status}. Response: ${responseText}`);
    }

    const responseData = await response.json().catch(() => ({}));
    console.log('Webhook call successful:', responseData);

    return new Response(
      JSON.stringify({ success: true, response: responseData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in trigger-zapier:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

