
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header with the JWT token
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Parse the JWT payload (without verification, just for debugging)
    const token = authHeader.replace('Bearer ', '');
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid JWT format' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    // Extract payload
    const payload = JSON.parse(atob(parts[1]));
    
    // This will be the user ID (auth.uid) used in RLS policies
    const userId = payload.sub;
    
    // Return auth context and JWT payload information for debugging
    return new Response(
      JSON.stringify({ 
        message: 'Auth context test successful',
        userId,
        role: payload.role,
        exp: new Date(payload.exp * 1000).toISOString(),
        iat: new Date(payload.iat * 1000).toISOString(),
        metadata: payload.user_metadata,
        jwtSummary: {
          header: parts[0].substring(0, 10) + '...',
          payload: parts[1].substring(0, 10) + '...',
          signature: parts[2].substring(0, 10) + '...',
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in test-auth-context:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
