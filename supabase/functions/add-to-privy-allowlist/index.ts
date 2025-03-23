
import { corsHeaders } from "../_shared/cors.ts";

interface AllowlistRequest {
  email: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { email }: AllowlistRequest = await req.json();
    
    if (!email) {
      throw new Error('Email is required');
    }

    // Get Privy credentials from environment variables
    const appId = Deno.env.get("PRIVY_APP_ID");
    const appSecret = Deno.env.get("PRIVY_APP_SECRET");

    if (!appId || !appSecret) {
      throw new Error('Privy credentials not configured');
    }

    // Base64 encoding for Authorization header
    const base64Auth = btoa(`${appId}:${appSecret}`);

    // Privy allowlist API endpoint
    const url = `https://auth.privy.io/api/v1/apps/${appId}/allowlist`;

    console.log(`Adding ${email} to Privy allowlist`);

    // Data to send to Privy
    const data = {
      'type': 'email',
      'value': email
    };

    // Make request to Privy API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${base64Auth}`,
        'privy-app-id': appId
      },
      body: JSON.stringify(data)
    });

    // Parse response
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Error from Privy API:', result);
      throw new Error(`Failed to add user to Privy allowlist: ${result.message || 'Unknown error'}`);
    }

    console.log('User added to Privy allowlist successfully:', result);

    return new Response(
      JSON.stringify({ success: true, message: "User added to Privy allowlist", result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in add-to-privy-allowlist:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
